import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bestCompletedSets,
  nutritionSummary,
  recentWeightEntries,
  summarizeWeight,
  workoutWeeks,
} from '../src/screens/health/statsMetrics.js';

const localDate = (year, month, day) => new Date(year, month - 1, day);

test('weight trend uses elapsed dates and ignores invalid or out-of-window entries', () => {
  const today = localDate(2026, 8, 14);
  const entries = recentWeightEntries([
    { date: '2026-05-01', value: 90 },
    { date: '2026-08-07', value: 82.5 },
    { date: '2026-08-14', value: 82 },
    { date: '2026-08-15', value: 81.9 },
    { date: '2026-08-10', value: 0 },
  ], today);
  const trend = summarizeWeight(entries);

  assert.deepEqual(entries.map((entry) => entry.date), ['2026-08-07', '2026-08-14']);
  assert.equal(trend.change, -0.5);
  assert.equal(trend.spanDays, 7);
  assert.equal(trend.weeklyPace, -0.5);
});

test('training rhythm deduplicates archive and summary records for the same date', () => {
  const weeks = workoutWeeks({
    workoutHistory: [
      { date: '2026-08-10' },
      { date: '2026-08-14' },
    ],
    hist: {
      '2026-08-03': { trained: true },
      '2026-08-10': { trained: true },
    },
  }, localDate(2026, 8, 14));

  assert.deepEqual(weeks.map((week) => week.sessions), [0, 0, 1, 2]);
});

test('nutrition adherence counts only logged closed days and uses historical goals', () => {
  const summary = nutritionSummary({
    goals: { kcal: 2500, p: 170 },
    goalHist: {
      '2026-08-12': { kcal: 1800, p: 150 },
      '2026-08-13': { kcal: 2000, p: 150 },
    },
    hist: {
      '2026-08-11': { kcal: 0, p: 0 },
      '2026-08-12': { kcal: 1840, p: 160 },
      '2026-08-13': { kcal: 2100, p: 140 },
    },
  }, localDate(2026, 8, 14));

  assert.equal(summary.loggedDays, 2);
  assert.equal(summary.calorieHits, 1);
  assert.equal(summary.proteinHits, 1);
});

test('best sets keep the heaviest completed set, then reps, with recent context', () => {
  const best = bestCompletedSets([
    {
      date: '2026-08-01',
      name: 'Upper A',
      exercises: [{ name: 'Bench press', sets: [{ w: 80, r: 8 }] }],
    },
    {
      date: '2026-08-08',
      name: 'Upper B',
      exercises: [{ name: 'Bench press', sets: [{ w: 80, r: 10 }, { w: 0, r: 20 }] }],
    },
    {
      date: '2026-08-12',
      name: 'Full body',
      exercises: [
        { name: 'Bench press', sets: [{ w: 80, r: 10 }] },
        { name: 'Squat', sets: [{ w: 100, r: 5 }] },
      ],
    },
  ]);

  assert.equal(best[0].name, 'Bench press');
  assert.equal(best[0].reps, 10);
  assert.equal(best[0].date, '2026-08-12');
  assert.equal(best[0].workoutName, 'Full body');
  assert.equal(best[1].name, 'Squat');
});
