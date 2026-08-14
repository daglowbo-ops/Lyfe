import test from 'node:test';
import assert from 'node:assert/strict';
import { newAccountState, seedState } from '../src/data/seed.js';
import { rolloverData } from '../src/store/model.js';
import { reconcile } from '../src/store/persistence.js';
import { incomeSummary, spendByDay, totalSpent, transactionsForMonth } from '../src/store/selectors.js';
import { key, monthKey } from '../src/lib/date.js';
import { initialState, reducer } from '../src/store/reducer.js';
import { CATALOG, foodMatchesQuery } from '../src/data/foods.js';

const localDate = (year, month, day) => new Date(year, month - 1, day);

test('seeded transactions retain full dates across six months', () => {
  const today = localDate(2026, 8, 11);
  const state = seedState(today);
  assert.ok(state.txns.every((txn) => /^\d{4}-\d{2}-\d{2}$/.test(txn.date)));
  assert.equal(new Set(state.txns.map((txn) => txn.date.slice(0, 7))).size, 6);
});

test('a new web account starts without another person’s demo records', () => {
  const state = newAccountState(localDate(2026, 8, 11), 'Ana');
  assert.equal(state.profileName, 'Ana');
  assert.equal(state.meals.length, 0);
  assert.equal(state.txns.length, 0);
  assert.equal(state.weights.length, 0);
  assert.equal(state.income, 0);
  assert.deepEqual(state.plan, {});

  const reset = reducer(initialState(seedState(localDate(2026, 8, 11))), { type: 'reset' });
  assert.equal(reset.meals.length, 0);
  assert.equal(reset.txns.length, 0);
});

test('food search reads in English and accepts Spanish with or without accents', () => {
  const oats = CATALOG.find((food) => food.name === 'Rolled oats, 60 g');
  const banana = CATALOG.find((food) => food.name === 'Medium banana');
  assert.equal(foodMatchesQuery(oats, 'oats'), true);
  assert.equal(foodMatchesQuery(oats, 'avena'), true);
  assert.equal(foodMatchesQuery(banana, 'platano'), true);
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

test('legacy monthly income migrates to a fixed base for the current month only', () => {
  const today = localDate(2026, 8, 11);
  const migrated = reconcile({ income: 8200 }, newAccountState(today), today);
  assert.equal(migrated.fixedIncome, 8200);
  assert.equal(migrated.income, 8200);
  assert.equal(migrated.incomeHistory['2026-08'], 8200);
  assert.deepEqual(migrated.variableIncomes, []);

  const prior = incomeSummary(migrated, localDate(2026, 7, 1));
  assert.equal(prior.hasKnownBase, false);
  assert.equal(prior.confirmed, 0);
});

test('received and expected variable income remain separate in confirmed totals', () => {
  const today = new Date();
  let state = initialState(newAccountState(today));
  state = reducer(state, { type: 'setFixedIncome', value: '6000' });
  state = reducer(state, { type: 'addVariableIncome', label: 'Consulting', amt: '500', status: 'received' });
  state = reducer(state, { type: 'addVariableIncome', label: 'Commission', amt: '700', status: 'expected' });

  const summary = incomeSummary(state, today);
  assert.equal(summary.fixed, 6000);
  assert.equal(summary.receivedVariable, 500);
  assert.equal(summary.expectedVariable, 700);
  assert.equal(summary.confirmed, 6500);
  assert.equal(summary.projected, 7200);
  assert.ok(summary.entries.every((entry) => entry.date.startsWith(monthKey(today))));

  const received = state.variableIncomes.find((entry) => entry.label === 'Consulting');
  const removed = reducer(state, { type: 'removeVariableIncome', id: received.id });
  const restored = reducer(removed, { type: 'undoLast' });
  assert.equal(restored.variableIncomes.some((entry) => entry.id === received.id), true);
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

test('workout set and rep pickers apply a bounded value in one reducer action', () => {
  const state = initialState(seedState(new Date()));
  const resized = reducer(state, { type: 'setSetCount', i: 0, value: 7 });
  assert.equal(resized.workout[0].sets.length, 7);
  assert.equal(resized.workout[0].sets[6].d, false);

  const repicked = reducer(resized, { type: 'setRepCount', i: 0, value: 22 });
  assert.ok(repicked.workout[0].sets.every((set) => set.r === 22));

  const bounded = reducer(repicked, { type: 'setRepCount', i: 0, value: 999 });
  assert.ok(bounded.workout[0].sets.every((set) => set.r === 50));
  assert.equal(reducer(bounded, { type: 'setSetCount', i: 0, value: 0 }).workout[0].sets.length, 1);
});

test('deleting an expense is reversible and restores the exact transaction', () => {
  const state = initialState(seedState(new Date()));
  const item = state.txns[0];
  const removed = reducer(state, { type: 'removeTxn', id: item.id });
  assert.equal(removed.txns.some((txn) => txn.id === item.id), false);
  assert.equal(removed.undo.item, item);

  const restored = reducer(removed, { type: 'undoLast' });
  assert.equal(restored.txns.some((txn) => txn.id === item.id), true);
  assert.equal(restored.undo, null);
});

test('the visible row action reveals a stable delete rail without entering drag mode', () => {
  const state = initialState(seedState(new Date()));
  const item = state.txns[0];
  const revealed = reducer(state, { type: 'swipeReveal', id: item.id });
  assert.deepEqual(revealed.swipe, {
    id: item.id,
    x: -88,
    base: -88,
    startX: 0,
    dragging: false,
  });
});

test('food, workout, and bill deletions are reversible in their original position', () => {
  const state = initialState(seedState(new Date()));

  const meal = state.meals[1];
  const withoutMeal = reducer(state, { type: 'removeFood', id: meal.id });
  const mealRestored = reducer(withoutMeal, { type: 'undoLast' });
  assert.equal(mealRestored.meals[1], meal);

  const template = state.templates[0];
  const withoutTemplate = reducer(state, { type: 'removeTemplate', i: 0 });
  const templateRestored = reducer(withoutTemplate, { type: 'undoLast' });
  assert.equal(templateRestored.templates[0], template);

  const bill = state.bills[0];
  const withoutBill = reducer(state, { type: 'removeBill', id: bill.id });
  const billRestored = reducer(withoutBill, { type: 'undoLast' });
  assert.equal(billRestored.bills[0], bill);
});

test('the shared profile preserves its originating module and screen', () => {
  let state = initialState(seedState(new Date()));
  state = reducer(state, { type: 'module', module: 'money' });
  state = reducer(state, { type: 'moneyScreen', screen: 'stats' });
  state = reducer(state, { type: 'openProfile' });
  assert.equal(state.module, 'money');
  assert.equal(state.mScreen, 'stats');
  assert.equal(state.profileOpen, true);

  state = reducer(state, { type: 'closeProfile' });
  assert.equal(state.module, 'money');
  assert.equal(state.mScreen, 'stats');
  assert.equal(state.profileOpen, false);
});
