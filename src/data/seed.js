import { CATALOG } from './foods.js';
import {
  CATEGORIES, SAMPLE_LABELS, SAMPLE_RANGES, DEFAULT_BUDGETS, DEFAULT_FAVOURITES,
  DEFAULT_BILLS, DEFAULT_INCOME,
} from './money.js';
import { DEFAULT_CYCLE, seedTemplates, seedWorkout } from './templates.js';
import { addDays, dowIndex, key, monthKey, startOfToday } from '../lib/date.js';

/**
 * Deterministic LCG. A first run should always produce the same demo history,
 * otherwise every reload reshuffles the user's charts.
 */
function rng(seed) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

export function seedMeals() {
  const pick = (name, slot) => {
    const item = CATALOG.find((x) => x.name === name);
    return { ...item, slot, id: name + slot };
  };
  return [
    pick('Rolled oats, 60 g', 'Desayuno'),
    pick('Greek yogurt, 170 g', 'Desayuno'),
    pick('Medium banana', 'Desayuno'),
    pick('Chicken breast, 200 g', 'Almuerzo'),
    pick('White rice, 1 cup', 'Almuerzo'),
    pick('Half avocado', 'Almuerzo'),
    pick('Protein shake, 1 scoop', 'Snacks'),
  ];
}

/** 90 days of closed-out days behind today: calories eaten, protein, trained yes/no. */
export function seedHistory(today = startOfToday()) {
  const rnd = rng(7);
  const hist = {};
  for (let i = 90; i >= 1; i--) {
    const d = addDays(today, -i);
    const dow = dowIndex(d);
    // Wednesday and Sunday are rest days in the seeded routine.
    const trained = dow !== 2 && dow !== 6 && rnd() > 0.14;
    hist[key(d)] = { kcal: Math.round(1950 + rnd() * 620), p: Math.round(120 + rnd() * 80), trained };
  }
  return hist;
}

/**
 * Goals as they stood on each day. Past days keep the goal they were set under,
 * which is what makes "días en objetivo" honest after a cut changes.
 */
export function seedGoalHistory(today = startOfToday()) {
  const hist = {};
  for (let i = 120; i >= -60; i--) {
    const d = addDays(today, -i);
    hist[key(d)] =
      i > 70 ? { kcal: 2650, p: 165 }
      : i > 42 ? { kcal: 2550, p: 170 }
      : i > 14 ? { kcal: 2400, p: 175 }
      : { kcal: 2200, p: 180 };
  }
  return hist;
}

/** 60 days of planned sessions ahead, following the default weekly cycle. */
export function seedPlan(today = startOfToday()) {
  const plan = {};
  for (let i = 0; i < 60; i++) {
    const d = addDays(today, i);
    plan[key(d)] = DEFAULT_CYCLE[dowIndex(d)];
  }
  return plan;
}

/** 12 dated weekly bodyweight readings, trending down. */
export function seedWeights(today = startOfToday()) {
  const rnd = rng(19);
  const out = [];
  let w = 84.9;
  for (let i = 0; i < 12; i++) {
    const date = key(addDays(today, -(11 - i) * 7));
    out.push({ id: `weight-${date}`, date, value: Math.round(w * 10) / 10 });
    w -= 0.18 + rnd() * 0.46;
  }
  return out;
}

/** Dated expenses for the last six months, including the current month. */
export function seedTransactions(today = startOfToday()) {
  const rnd = rng(23);
  const out = [];
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const month = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
    const lastDay = monthOffset === 0
      ? today.getDate()
      : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const rentDate = new Date(month.getFullYear(), month.getMonth(), 1);
    out.push({ id: `rent-${key(rentDate)}`, label: 'Rent', amt: 2800, cat: 'Hogar', date: key(rentDate) });
    for (let day = 1; day <= lastDay; day++) {
      const n = 1 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const cat = CATEGORIES[Math.floor(rnd() * CATEGORIES.length)];
        const pool = SAMPLE_LABELS[cat];
        const [lo, hi] = SAMPLE_RANGES[cat];
        const date = key(new Date(month.getFullYear(), month.getMonth(), day));
        out.push({
          id: `t-${date}-${i}`,
          label: pool[Math.floor(rnd() * pool.length)],
          amt: Math.round((lo + rnd() * (hi - lo)) * 100) / 100,
          cat,
          date,
        });
      }
    }
  }
  return out;
}

/**
 * Totals for the five months before this one, keyed YYYY-MM. Real months
 * accumulate from `txns`; these exist so the six-month chart has something to
 * compare against on day one.
 */
export function seedMonthHistory(today = startOfToday()) {
  const rnd = rng(11);
  const out = {};
  for (let i = 5; i >= 1; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    out[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = Math.round(7400 + rnd() * 2600);
  }
  return out;
}

function seedIncomeHistory(today = startOfToday(), income = DEFAULT_INCOME) {
  const out = {};
  for (let i = 5; i >= 0; i--) {
    out[monthKey(new Date(today.getFullYear(), today.getMonth() - i, 1))] = income;
  }
  return out;
}

/** Everything a brand-new install starts with. */
export function seedState(today = startOfToday()) {
  const todayKey = key(today);
  return {
    activeDate: todayKey,
    meals: seedMeals(),
    workout: seedWorkout(),
    sessionFinished: false,
    dailyLogs: {},
    workoutHistory: [],
    templates: seedTemplates(),
    curName: 'Push A',
    customFoods: [],
    hist: seedHistory(today),
    goalHist: seedGoalHistory(today),
    plan: seedPlan(today),
    weights: seedWeights(today),
    goals: { kcal: 2200, p: 180, c: 250, f: 70 },
    txns: seedTransactions(today),
    monthHist: seedMonthHistory(today),
    budgets: DEFAULT_BUDGETS.map((b) => ({ ...b })),
    favs: DEFAULT_FAVOURITES.map((f) => ({ ...f })),
    income: DEFAULT_INCOME,
    fixedIncome: DEFAULT_INCOME,
    incomeHistory: seedIncomeHistory(today),
    variableIncomes: [],
    bills: DEFAULT_BILLS.map((b) => ({ ...b })),
    profileName: 'Robin Kade',
    toggles: { haptics: true, kg: true, lock: false },
  };
}

/** Clean production record for a newly authenticated account. */
export function newAccountState(today = startOfToday(), profileName = 'Your name') {
  const todayKey = key(today);
  return {
    activeDate: todayKey,
    meals: [],
    workout: seedWorkout(),
    sessionFinished: false,
    dailyLogs: {},
    workoutHistory: [],
    templates: seedTemplates(),
    curName: 'Push A',
    customFoods: [],
    hist: {},
    goalHist: { [todayKey]: { kcal: 2200, p: 180 } },
    plan: {},
    weights: [],
    goals: { kcal: 2200, p: 180, c: 250, f: 70 },
    txns: [],
    monthHist: {},
    budgets: DEFAULT_BUDGETS.map((budget) => ({ ...budget, limit: 0 })),
    favs: [],
    income: 0,
    fixedIncome: 0,
    incomeHistory: { [monthKey(today)]: 0 },
    variableIncomes: [],
    bills: [],
    profileName,
    toggles: { haptics: true, kg: true, lock: false },
  };
}
