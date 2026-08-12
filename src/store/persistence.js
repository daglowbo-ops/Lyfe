import { addDays, key, monthKey, startOfToday } from '../lib/date.js';

export const STORAGE_KEY = 'fieldnote.v6';
const LEGACY_KEYS = ['fieldnote.v5'];

/** Durable user-owned data. This shape is also the future sync boundary. */
export const PERSISTED = [
  'activeDate', 'meals', 'workout', 'sessionFinished', 'dailyLogs', 'workoutHistory',
  'templates', 'curName', 'customFoods', 'hist', 'goalHist', 'plan', 'weights', 'goals',
  'txns', 'monthHist', 'budgets', 'favs', 'income', 'bills', 'profileName', 'toggles',
];

export function load() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return JSON.parse(current);
    for (const legacyKey of LEGACY_KEYS) {
      const legacy = localStorage.getItem(legacyKey);
      if (legacy) return { ...JSON.parse(legacy), _legacy: legacyKey };
    }
    return null;
  } catch {
    return null;
  }
}

export function snapshot(state) {
  const out = { schemaVersion: 6, updatedAt: new Date().toISOString() };
  for (const field of PERSISTED) out[field] = state[field];
  return out;
}

export function fingerprint(state) {
  const durable = {};
  for (const field of PERSISTED) durable[field] = state[field];
  return JSON.stringify(durable);
}

export function save(state) {
  const payload = snapshot(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage can be unavailable or full. The app remains usable in memory.
  }
  return payload;
}

export function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    for (const legacyKey of LEGACY_KEYS) localStorage.removeItem(legacyKey);
  } catch {
    // Ignore unavailable storage.
  }
}

const isDayMap = (value, check) =>
  value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(check);
const arr = (value, fallback) => (Array.isArray(value) ? value : fallback);

function normalizeWeights(value, fallback, today) {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  if (typeof value[0] === 'object') {
    return value
      .filter((entry) => entry && typeof entry.value === 'number' && typeof entry.date === 'string')
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return value
    .filter((weight) => typeof weight === 'number')
    .map((weight, index, all) => {
      const date = key(addDays(today, -(all.length - 1 - index) * 7));
      return { id: `weight-${date}-${index}`, date, value: weight };
    });
}

function normalizeTransactions(saved, seed, today) {
  const input = arr(saved.txns, []);
  if (input.some((txn) => typeof txn?.date === 'string')) {
    return input.filter((txn) => txn && typeof txn.date === 'string' && typeof txn.amt === 'number');
  }

  // v5 only stored the current month and used a bare day number. Preserve it,
  // then retain seeded detail for earlier months so historical calendars work.
  const currentMonth = monthKey(today);
  const historic = seed.txns.filter((txn) => !txn.date.startsWith(currentMonth));
  const migrated = input
    .filter((txn) => txn && typeof txn.day === 'number' && typeof txn.amt === 'number')
    .map((txn) => {
      const max = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const day = Math.min(max, Math.max(1, txn.day));
      return { ...txn, date: `${currentMonth}-${String(day).padStart(2, '0')}` };
    });
  return historic.concat(migrated.length ? migrated : seed.txns.filter((txn) => txn.date.startsWith(currentMonth)));
}

/** Reconcile older local snapshots with the current production shape. */
export function reconcile(saved, seed, today = startOfToday()) {
  if (!saved || typeof saved !== 'object') return seed;

  const hist = isDayMap(saved.hist, (v) => v && typeof v.kcal === 'number' && typeof v.p === 'number')
    ? saved.hist
    : seed.hist;
  const goalHist = isDayMap(saved.goalHist, (v) => v && typeof v.kcal === 'number')
    ? { ...seed.goalHist, ...saved.goalHist }
    : seed.goalHist;
  const templates = arr(saved.templates, seed.templates);
  const workout = arr(saved.workout, seed.workout);

  return {
    ...seed,
    activeDate: typeof saved.activeDate === 'string' ? saved.activeDate : key(today),
    meals: arr(saved.meals, seed.meals),
    workout: workout.length ? workout : seed.workout,
    sessionFinished: Boolean(saved.sessionFinished),
    dailyLogs: saved.dailyLogs && typeof saved.dailyLogs === 'object' ? saved.dailyLogs : {},
    workoutHistory: arr(saved.workoutHistory, []),
    templates,
    curName: typeof saved.curName === 'string' ? saved.curName : seed.curName,
    customFoods: arr(saved.customFoods, []),
    hist,
    goalHist,
    plan: { ...seed.plan, ...(saved.plan || {}) },
    weights: normalizeWeights(saved.weights, seed.weights, today),
    goals: { ...seed.goals, ...(saved.goals || {}) },
    txns: normalizeTransactions(saved, seed, today),
    monthHist: { ...seed.monthHist, ...(saved.monthHist || {}) },
    budgets: arr(saved.budgets, seed.budgets),
    favs: arr(saved.favs, seed.favs),
    income: typeof saved.income === 'number' ? saved.income : seed.income,
    bills: arr(saved.bills, seed.bills),
    profileName: typeof saved.profileName === 'string' ? saved.profileName : seed.profileName,
    toggles: { ...seed.toggles, ...(saved.toggles || {}), offline: undefined },
  };
}
