import { addDays, key } from '../../lib/date.js';
import { goalOn, onTarget } from '../../store/selectors.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

/** Valid, dated weigh-ins inside the trailing window, oldest first. */
export function recentWeightEntries(weights, today, days = 84) {
  const firstKey = key(addDays(today, -(days - 1)));
  const todayKey = key(today);
  return (weights || [])
    .filter((entry) => (
      entry?.date >= firstKey
      && entry.date <= todayKey
      && Number.isFinite(entry.value)
      && entry.value > 0
    ))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Change and weekly pace use elapsed calendar time, not number of weigh-ins. */
export function summarizeWeight(entries) {
  if (!entries.length) return null;
  const first = entries[0];
  const latest = entries.at(-1);
  const spanDays = Math.max(0, dayNumber(latest.date) - dayNumber(first.date));
  const change = latest.value - first.value;
  return {
    first,
    latest,
    spanDays,
    change,
    weeklyPace: spanDays > 0 ? change / (spanDays / 7) : null,
  };
}

/**
 * Rolling seven-day buckets, oldest first. A date is counted once even when a
 * detailed archive and the legacy daily summary both exist.
 */
export function workoutWeeks(state, today, weekCount = 4) {
  const trainedDates = new Set(
    (state.workoutHistory || [])
      .map((session) => session?.date)
      .filter(Boolean),
  );
  for (const [date, record] of Object.entries(state.hist || {})) {
    if (record?.trained) trainedDates.add(date);
  }

  return Array.from({ length: weekCount }, (_, index) => {
    const weeksAgo = weekCount - 1 - index;
    const dates = Array.from({ length: 7 }, (_, dayIndex) => (
      key(addDays(today, -(weeksAgo * 7 + (6 - dayIndex))))
    ));
    return {
      start: dates[0],
      end: dates.at(-1),
      sessions: dates.filter((date) => trainedDates.has(date)).length,
    };
  });
}

/** Nutrition adherence over closed days; unlogged days remain visible coverage, not false misses. */
export function nutritionSummary(state, today, days = 14) {
  const records = Array.from({ length: days }, (_, index) => {
    const date = key(addDays(today, -(days - index)));
    return { date, record: state.hist?.[date] };
  });
  const logged = records.filter(({ record }) => Number(record?.kcal) > 0);
  const calorieHits = logged.filter(({ date, record }) => (
    onTarget(record.kcal, goalOn(state, date).kcal)
  )).length;
  const proteinHits = logged.filter(({ date, record }) => (
    Number(record.p) >= goalOn(state, date).p
  )).length;

  return {
    days,
    loggedDays: logged.length,
    calorieHits,
    proteinHits,
  };
}

/** Heaviest completed set per exercise, using reps as the tie-breaker. */
export function bestCompletedSets(workoutHistory) {
  const best = new Map();
  for (const session of workoutHistory || []) {
    for (const exercise of session?.exercises || []) {
      if (!exercise?.name) continue;
      for (const set of exercise.sets || []) {
        const weight = Number(set?.w);
        const reps = Number(set?.r);
        if (!(weight > 0) || !(reps > 0)) continue;
        const current = best.get(exercise.name);
        const sessionDate = session.date || '';
        const isHeavier = !current || weight > current.weight;
        const hasMoreReps = current && weight === current.weight && reps > current.reps;
        const isNewerTie = current
          && weight === current.weight
          && reps === current.reps
          && sessionDate > current.date;
        if (isHeavier || hasMoreReps || isNewerTie) {
          best.set(exercise.name, {
            name: exercise.name,
            weight,
            reps,
            date: sessionDate,
            workoutName: session.name,
          });
        }
      }
    }
  }

  return [...best.values()]
    .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
}
