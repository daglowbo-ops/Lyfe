import { addDays, daysInMonth, key, monthKey, startOfToday } from '../lib/date.js';

/** Calories/macros logged today. */
export function dayTotals(meals) {
  return meals.reduce(
    (a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

/** The goal that was in force on a given day, falling back to the current one. */
export const goalOn = (state, k) => {
  const v = state.goalHist[k];
  return v && typeof v === 'object' ? v : { kcal: state.goals.kcal, p: state.goals.p };
};

/**
 * A day counts as "on target" with 60 kcal of slack — the design's tolerance,
 * and about the error in a single hand-logged portion.
 */
export const KCAL_SLACK = 60;
export const onTarget = (kcal, goal) => kcal > 0 && kcal <= goal + KCAL_SLACK;

export function workoutTotals(workout) {
  const all = workout.reduce((a, e) => a + e.sets.length, 0);
  const done = workout.reduce((a, e) => a + e.sets.filter((s) => s.d).length, 0);
  const volume = workout.reduce(
    (a, e) => a + e.sets.filter((s) => s.d).reduce((x, s) => x + s.w * s.r, 0),
    0,
  );
  return { all, done, volume };
}

/** Consecutive days behind today that hit either the calorie or the training goal. */
export function streak(state, today = startOfToday()) {
  let n = 0;
  for (let i = 1; i < 60; i++) {
    const k = key(addDays(today, -i));
    const h = state.hist[k];
    if (h && (h.trained || onTarget(h.kcal, goalOn(state, k).kcal))) n++;
    else break;
  }
  return n;
}

// ── Money ───────────────────────────────────────────────────────────

export const transactionsForMonth = (txns, date = startOfToday()) => {
  const prefix = monthKey(date);
  return txns.filter((txn) => txn.date?.startsWith(prefix));
};

export const totalSpent = (txns, date = startOfToday()) =>
  transactionsForMonth(txns, date).reduce((a, t) => a + t.amt, 0);

export const totalBudget = (budgets) => budgets.reduce((a, b) => a + b.limit, 0);

export function spentByCategory(state, date = startOfToday()) {
  const txns = transactionsForMonth(state.txns, date);
  return state.budgets.map((b, i) => {
    const spent = txns.filter((t) => t.cat === b.cat).reduce((a, t) => a + t.amt, 0);
    return { i, cat: b.cat, limit: b.limit, spent, over: spent > b.limit };
  });
}

/** Days remaining in the current month, today included. */
export function daysLeftInMonth(today = startOfToday()) {
  return Math.max(1, daysInMonth(today) - today.getDate() + 1);
}

/** Bills still ahead of today this month. */
export function upcomingBills(bills, today = startOfToday()) {
  return bills.filter((b) => b.day >= today.getDate()).sort((a, b) => a.day - b.day);
}

/** Spend per day-of-month for the current month, indexed from 0. */
export function spendByDay(txns, month = startOfToday()) {
  const out = new Array(daysInMonth(month)).fill(0);
  for (const t of transactionsForMonth(txns, month)) {
    const day = Number(t.date.slice(-2));
    if (day >= 1 && day <= out.length) out[day - 1] += t.amt;
  }
  return out;
}
