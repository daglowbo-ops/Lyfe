import test from 'node:test';
import assert from 'node:assert/strict';
import { seedState } from '../src/data/seed.js';
import { rolloverData } from '../src/store/model.js';
import { reconcile } from '../src/store/persistence.js';
import { spendByDay, totalSpent, transactionsForMonth } from '../src/store/selectors.js';
import { key } from '../src/lib/date.js';
import { initialState, reducer } from '../src/store/reducer.js';

const localDate = (year, month, day) => new Date(year, month - 1, day);

test('seeded transactions retain full dates across six months', () => {
  const today = localDate(2026, 8, 11);
  const state = seedState(today);
  assert.ok(state.txns.every((txn) => /^\d{4}-\d{2}-\d{2}$/.test(txn.date)));
  assert.equal(new Set(state.txns.map((txn) => txn.date.slice(0, 7))).size, 6);
});

test('month selectors isolate spending and daily totals', () => {
  const txns = [
    { id: 'a', date: '2026-07-03', amt: 10, cat: 'Otros' },
    { id: 'b', date: '2026-08-03', amt: 20, cat: 'Otros' },
    { id: 'c', date: '2026-08-04', amt: 30, cat: 'Otros' },
  ];
  const august = localDate(2026, 8, 1);
  assert.equal(transactionsForMonth(txns, august).length, 2);
  assert.equal(totalSpent(txns, august), 50);
  assert.equal(spendByDay(txns, august)[2], 20);
  assert.equal(spendByDay(txns, august)[3], 30);
});

test('rollover closes the prior day and opens a clean dated log', () => {
  const first = localDate(2026, 8, 11);
  const next = localDate(2026, 8, 12);
  const state = seedState(first);
  state.workout[0].sets[0].d = true;
  const rolled = rolloverData(state, key(next));
  assert.equal(rolled.activeDate, '2026-08-12');
  assert.equal(rolled.meals.length, 0);
  assert.equal(rolled.dailyLogs['2026-08-11'].meals.length, state.meals.length);
  assert.equal(rolled.hist['2026-08-11'].trained, true);
  assert.ok(rolled.workout.every((exercise) => exercise.sets.every((set) => !set.d)));
});

test('v5 transactions and numeric weights migrate without data loss', () => {
  const today = localDate(2026, 8, 11);
  const seed = seedState(today);
  const migrated = reconcile({
    txns: [{ id: 'old', day: 4, amt: 18, label: 'Café', cat: 'Comer fuera' }],
    weights: [82.5, 82.1],
  }, seed, today);
  assert.ok(migrated.txns.some((txn) => txn.id === 'old' && txn.date === '2026-08-04'));
  assert.deepEqual(migrated.weights.map((entry) => entry.value), [82.5, 82.1]);
  assert.ok(migrated.txns.some((txn) => txn.date.startsWith('2026-07')));
});

test('a completed workout is archived with detailed sets exactly once per day', () => {
  const today = new Date();
  const state = initialState(seedState(today));
  state.workout = state.workout.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => ({ ...set, d: true })),
  }));
  const finished = reducer(state, { type: 'finishWorkout' });
  assert.equal(finished.sessionFinished, true);
  assert.equal(finished.workoutHistory.length, 1);
  assert.ok(finished.workoutHistory[0].exercises[0].sets[0].w > 0);
  const repeated = reducer(finished, { type: 'finishWorkout' });
  assert.equal(repeated.workoutHistory.length, 1);
});
