import { key, startOfToday } from '../lib/date.js';
import { toFloat, toInt } from '../lib/format.js';
import { blankExercise, freshCopy } from '../data/templates.js';
import { newAccountState } from '../data/seed.js';
import { rolloverData } from './model.js';

export const REST_SECONDS = 90;
const uid = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

/** Transient UI state — never persisted, always starts from the same place. */
const freshUi = () => ({
  module: 'health',
  screen: 'today',
  mScreen: 'today',
  profileOpen: false,
  locked: true,

  // Food logging
  sheet: false,
  slot: 'Almuerzo',
  foodMode: 'search',
  query: '',
  draftFood: { name: '', kcal: '', p: '', c: '', f: '', save: true },

  // Training
  exIdx: 0,
  pickSheet: false,
  editSheet: false,
  resting: false,
  restLeft: 0,

  // Planning
  planMode: 'month',
  calOff: 0,
  sel: key(startOfToday()),
  dayMenu: null,

  // Money
  txnFilter: 'Todo',
  statMode: 'spend',
  statSel: 5,
  mPlanMode: 'month',
  mCalOff: 0,
  mSel: key(startOfToday()),
  addSheet: false,
  txnFiltersOpen: false,
  draftTxn: { amt: '', label: '', cat: 'Mercado', fav: false },
  lockBusy: false,
  lockError: '',

  // Short-lived confirmations and reversible destructive actions.
  notice: null,
  undo: null,

  // Swipe-to-delete gesture, tracked for one row at a time.
  swipe: { id: null, x: 0, base: 0, startX: 0, dragging: false },
});

export function initialState(data) {
  return { ...data, ...freshUi() };
}

/** Replace exercise `i` in the current workout via `fn`. */
const mapEx = (state, i, fn) => ({
  workout: state.workout.map((e, j) => (j === i ? fn(e) : e)),
});

function restoreAt(list, item, index, exists) {
  if (list.some(exists)) return list;
  const next = list.slice();
  next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
  return next;
}

export function reducer(state, action) {
  const a = action;
  switch (a.type) {
    // ── Navigation ────────────────────────────────────────────────
    case 'patch':
      return { ...state, ...a.patch };

    case 'module':
      // Re-arming the lock on every switch back into Money is the point of the
      // setting: leaving the module should mean leaving the balances behind.
      return {
        ...state,
        module: a.module,
        profileOpen: false,
        locked: a.module === 'money'
          ? (state.module === 'money' ? state.locked : state.toggles.lock)
          : state.toggles.lock,
      };

    case 'screen':
      return { ...state, module: 'health', screen: a.screen, profileOpen: false };

    case 'moneyScreen':
      return { ...state, mScreen: a.screen, profileOpen: false };

    case 'openProfile':
      return { ...state, profileOpen: true };

    case 'closeProfile':
      return { ...state, profileOpen: false };

    case 'rollover':
      return state.activeDate === a.date ? state : rolloverData(state, a.date);

    case 'hydrate':
      return initialState(a.data);

    // ── Swipe to delete ───────────────────────────────────────────
    case 'swipeStart': {
      const base = state.swipe.id === a.id ? state.swipe.x : 0;
      return { ...state, swipe: { id: a.id, x: base, base, startX: a.x, dragging: true } };
    }
    case 'swipeReveal':
      return { ...state, swipe: { id: a.id, x: -88, base: -88, startX: 0, dragging: false } };
    case 'swipeMove': {
      const s = state.swipe;
      if (!s.dragging) return state;
      const x = Math.min(0, Math.max(-96, s.base + (a.x - s.startX)));
      return { ...state, swipe: { ...s, x } };
    }
    case 'swipeEnd': {
      const s = state.swipe;
      if (!s.dragging) return state;
      const open = s.x < -44;
      return {
        ...state,
        swipe: { id: open ? s.id : null, x: open ? -88 : 0, base: open ? -88 : 0, startX: 0, dragging: false },
      };
    }
    case 'swipeReset':
      return { ...state, swipe: freshUi().swipe };

    // ── Food ──────────────────────────────────────────────────────
    case 'openFoodSheet':
      return { ...state, sheet: true, slot: a.slot, query: '', foodMode: 'search' };

    case 'closeFoodSheet':
      return { ...state, sheet: false, foodMode: 'search' };

    case 'addFood': {
      const meal = { ...a.item, slot: state.slot, id: uid('meal') };
      return {
        ...state,
        meals: state.meals.concat(meal),
        sheet: false,
        notice: { id: uid('notice'), message: `${meal.name} added` },
        undo: null,
      };
    }

    case 'removeFood': {
      const index = state.meals.findIndex((meal) => meal.id === a.id);
      const item = state.meals[index];
      if (!item) return state;
      return {
        ...state,
        meals: state.meals.filter((meal) => meal.id !== a.id),
        swipe: freshUi().swipe,
        notice: null,
        undo: { id: uid('undo'), kind: 'food', item, index, message: `${item.name} deleted` },
      };
    }

    case 'draftFood':
      return { ...state, draftFood: { ...state.draftFood, ...a.patch } };

    case 'quickAddFood': {
      const d = state.draftFood;
      const kcal = toInt(d.kcal);
      if (!kcal) return state;
      const item = {
        name: d.name.trim().slice(0, 120) || 'Quick entry',
        kcal,
        p: toInt(d.p),
        c: toInt(d.c),
        f: toInt(d.f),
        custom: true,
      };
      const keep = d.save && d.name.trim();
      return {
        ...state,
        meals: state.meals.concat({ ...item, slot: state.slot, id: uid('meal') }),
        customFoods: keep
          ? [item].concat(state.customFoods.filter((f) => f.name !== item.name))
          : state.customFoods,
        draftFood: { ...freshUi().draftFood, save: d.save },
        sheet: false,
        notice: { id: uid('notice'), message: `${item.name} added` },
        undo: null,
      };
    }

    // ── Training ──────────────────────────────────────────────────
    case 'toggleSet': {
      if (state.sessionFinished) return state;
      const nowDone = !state.workout[a.ei].sets[a.si].d;
      return {
        ...state,
        ...mapEx(state, a.ei, (e) => ({
          ...e,
          sets: e.sets.map((s, j) => (j === a.si ? { ...s, d: !s.d } : s)),
        })),
        // Completing a set starts the rest clock; un-ticking one leaves it alone.
        resting: nowDone,
        restLeft: nowDone ? REST_SECONDS : state.restLeft,
        sessionFinished: false,
      };
    }

    case 'bumpSet':
      return {
        ...state,
        ...mapEx(state, a.ei, (e) => ({
          ...e,
          sets: e.sets.map((s, j) =>
            j === a.si ? { ...s, [a.field]: Math.max(0, Math.round((s[a.field] + a.delta) * 10) / 10) } : s,
          ),
        })),
      };

    case 'renameExercise':
      return { ...state, ...mapEx(state, a.i, (e) => ({ ...e, name: String(a.name).slice(0, 100) })) };

    case 'setsDelta':
      return {
        ...state,
        ...mapEx(state, a.i, (e) => {
          const sets = e.sets.slice();
          if (a.delta > 0) sets.push({ ...(sets[sets.length - 1] || { w: 20, r: 10 }), d: false });
          else if (sets.length > 1) sets.pop();
          return { ...e, sets };
        }),
      };

    case 'setSetCount':
      return {
        ...state,
        ...mapEx(state, a.i, (e) => {
          const target = Math.max(1, Math.min(12, toInt(a.value)));
          if (target === e.sets.length) return e;
          if (target < e.sets.length) return { ...e, sets: e.sets.slice(0, target) };

          const sets = e.sets.slice();
          const source = sets[sets.length - 1] || { w: 20, r: 10 };
          while (sets.length < target) sets.push({ ...source, d: false });
          return { ...e, sets };
        }),
      };

    case 'repsDelta':
      return {
        ...state,
        ...mapEx(state, a.i, (e) => ({
          ...e,
          sets: e.sets.map((s) => ({ ...s, r: Math.max(1, s.r + a.delta) })),
        })),
      };

    case 'setRepCount':
      return {
        ...state,
        ...mapEx(state, a.i, (e) => {
          const reps = Math.max(1, Math.min(50, toInt(a.value)));
          return { ...e, sets: e.sets.map((s) => ({ ...s, r: reps })) };
        }),
      };

    case 'addExercise':
      return { ...state, workout: state.workout.concat(blankExercise()) };

    case 'removeExercise':
      // A session always keeps at least one exercise, or the screen has nothing to show.
      if (state.workout.length <= 1) return state;
      return {
        ...state,
        workout: state.workout.filter((_, j) => j !== a.i),
        exIdx: Math.max(0, Math.min(state.exIdx, state.workout.length - 2)),
      };

    case 'pickTemplate': {
      const t = state.templates[a.i];
      if (!t) return state;
      return {
        ...state,
        workout: freshCopy(t.exercises),
        curName: t.name,
        exIdx: 0,
        pickSheet: false,
        screen: 'train',
        resting: false,
        restLeft: 0,
        sessionFinished: false,
      };
    }

    case 'saveTemplate': {
      const entry = { name: state.curName, exercises: freshCopy(state.workout) };
      const i = state.templates.findIndex((t) => t.name === state.curName);
      const templates = state.templates.slice();
      if (i >= 0) templates[i] = entry;
      else templates.push(entry);
      return {
        ...state,
        templates,
        editSheet: false,
        notice: { id: uid('notice'), message: `${entry.name} saved` },
        undo: null,
      };
    }

    case 'removeTemplate': {
      const item = state.templates[a.i];
      if (!item) return state;
      return {
        ...state,
        templates: state.templates.filter((_, j) => j !== a.i),
        notice: null,
        undo: { id: uid('undo'), kind: 'template', item, index: a.i, message: `${item.name} deleted` },
      };
    }

    case 'newTemplate':
      return {
        ...state,
        workout: [blankExercise()],
        curName: 'New workout',
        exIdx: 0,
        pickSheet: false,
        editSheet: true,
        screen: 'train',
        sessionFinished: false,
      };

    case 'finishWorkout': {
      const todayKey = key(startOfToday());
      const allSets = state.workout.flatMap((exercise) => exercise.sets);
      if (!allSets.length || allSets.some((set) => !set.d)) return state;
      const session = {
        id: `workout-${todayKey}`,
        date: todayKey,
        name: state.curName,
        completedAt: new Date().toISOString(),
        exercises: state.workout.map((exercise) => ({
          name: exercise.name,
          sets: exercise.sets.map((set) => ({ w: set.w, r: set.r })),
        })),
      };
      return {
        ...state,
        sessionFinished: true,
        resting: false,
        restLeft: 0,
        workoutHistory: [session].concat(state.workoutHistory.filter((item) => item.date !== todayKey)),
        hist: {
          ...state.hist,
          [todayKey]: { ...(state.hist[todayKey] || {}), trained: true },
        },
        dailyLogs: {
          ...state.dailyLogs,
          [todayKey]: {
            meals: state.meals,
            workout: state.workout,
            curName: state.curName,
            sessionFinished: true,
          },
        },
        screen: 'today',
      };
    }

    case 'restTick':
      if (!state.resting) return state;
      return state.restLeft <= 1
        ? { ...state, resting: false, restLeft: 0 }
        : { ...state, restLeft: state.restLeft - 1 };

    case 'skipRest':
      return { ...state, resting: false, restLeft: 0 };

    // ── Goals & plan ──────────────────────────────────────────────
    case 'setGoal': {
      const n = toInt(a.value);
      const todayKey = key(startOfToday());
      const goalHist = { ...state.goalHist };
      // A new goal applies from today forward. Past days keep what they were
      // judged against, so adherence stats stay meaningful.
      for (const k of Object.keys(goalHist)) {
        if (k < todayKey) continue;
        const cur = goalHist[k] || { kcal: state.goals.kcal, p: state.goals.p };
        goalHist[k] = { ...cur, [a.field]: n };
      }
      return { ...state, goals: { ...state.goals, [a.field]: n }, goalHist };
    }

    case 'setPlanDay':
      return { ...state, plan: { ...state.plan, [a.key]: a.name }, dayMenu: null };

    case 'toggleDayMenu':
      return { ...state, dayMenu: state.dayMenu === a.key ? null : a.key };

    case 'toggleSetting': {
      const toggles = { ...state.toggles, [a.key]: !state.toggles[a.key] };
      return {
        ...state,
        toggles,
        // Turning the lock off should take effect now, not at the next switch.
        locked: a.key === 'lock' ? (toggles.lock ? state.locked : false) : state.locked,
      };
    }

    case 'setDeviceLock':
      return {
        ...state,
        toggles: { ...state.toggles, lock: Boolean(a.enabled) },
        locked: Boolean(a.enabled),
        lockError: '',
      };

    case 'lockStatus':
      return { ...state, lockBusy: Boolean(a.busy), lockError: a.error || '' };

    case 'setProfileName':
      return { ...state, profileName: String(a.value).slice(0, 80) };

    case 'addWeight': {
      const value = toFloat(a.value);
      if (!value) return state;
      const date = key(startOfToday());
      const entry = { id: uid(`weight-${date}`), date, value };
      return {
        ...state,
        weights: state.weights.filter((item) => item.date !== date).concat(entry).sort((x, y) => x.date.localeCompare(y.date)),
        notice: { id: uid('notice'), message: `Weight logged for today` },
        undo: null,
      };
    }

    // ── Money ─────────────────────────────────────────────────────
    case 'draftTxn':
      return { ...state, draftTxn: { ...state.draftTxn, ...a.patch } };

    case 'openAddTxn':
      return {
        ...state,
        addSheet: true,
        notice: null,
        draftTxn: { ...freshUi().draftTxn, cat: state.draftTxn.cat },
      };

    case 'closeAddTxn':
      return { ...state, addSheet: false };

    case 'openTxnFilters':
      return { ...state, txnFiltersOpen: true };

    case 'closeTxnFilters':
      return { ...state, txnFiltersOpen: false };

    case 'selectTxnFilter':
      return { ...state, txnFilter: a.filter, txnFiltersOpen: false };

    case 'addTxn': {
      const amt = Math.min(99999999, toFloat(a.amt));
      if (!amt) return state;
      const label = ((a.label || '').trim() || a.cat).slice(0, 120);
      const txn = { id: uid('txn'), label, amt, cat: a.cat, date: key(startOfToday()) };
      return {
        ...state,
        txns: state.txns.concat(txn),
        favs: a.fav
          ? [{ label, amt, cat: a.cat }].concat(state.favs.filter((f) => f.label !== label)).slice(0, 6)
          : state.favs,
        addSheet: false,
        draftTxn: { ...freshUi().draftTxn, cat: a.cat },
        notice: { id: uid('notice'), message: `${label} added` },
        undo: null,
      };
    }

    case 'removeTxn': {
      const index = state.txns.findIndex((txn) => txn.id === a.id);
      const item = state.txns[index];
      if (!item) return state;
      return {
        ...state,
        txns: state.txns.filter((txn) => txn.id !== a.id),
        swipe: freshUi().swipe,
        notice: null,
        undo: { id: uid('undo'), kind: 'txn', item, index, message: `${item.label} deleted` },
      };
    }

    case 'undoLast': {
      const undo = state.undo;
      if (!undo) return state;
      if (undo.kind === 'txn') {
        return {
          ...state,
          txns: restoreAt(state.txns, undo.item, undo.index ?? state.txns.length, (item) => item.id === undo.item.id),
          notice: { id: uid('notice'), message: `${undo.item.label} restored` },
          undo: null,
        };
      }
      if (undo.kind === 'food') {
        return {
          ...state,
          meals: restoreAt(state.meals, undo.item, undo.index, (item) => item.id === undo.item.id),
          notice: { id: uid('notice'), message: `${undo.item.name} restored` },
          undo: null,
        };
      }
      if (undo.kind === 'template') {
        return {
          ...state,
          templates: restoreAt(state.templates, undo.item, undo.index, (item) => item === undo.item),
          notice: { id: uid('notice'), message: `${undo.item.name} restored` },
          undo: null,
        };
      }
      if (undo.kind === 'bill') {
        return {
          ...state,
          bills: restoreAt(state.bills, undo.item, undo.index, (item) => item.id === undo.item.id),
          notice: { id: uid('notice'), message: `${undo.item.name} restored` },
          undo: null,
        };
      }
      if (undo.kind === 'income') {
        return {
          ...state,
          variableIncomes: restoreAt(
            state.variableIncomes || [],
            undo.item,
            undo.index,
            (item) => item.id === undo.item.id,
          ),
          notice: { id: uid('notice'), message: `${undo.item.label} restored` },
          undo: null,
        };
      }
      return { ...state, undo: null };
    }

    case 'dismissNotice':
      return { ...state, notice: null };

    case 'dismissUndo':
      return { ...state, undo: null };

    case 'setLimit':
      return {
        ...state,
        budgets: state.budgets.map((b, j) => (j === a.i ? { ...b, limit: Math.max(0, toInt(a.value)) } : b)),
      };

    case 'setIncome':
    case 'setFixedIncome': {
      const fixedIncome = Math.max(0, toFloat(a.value));
      const month = key(startOfToday()).slice(0, 7);
      return {
        ...state,
        // Keep the legacy alias in sync so an older client can still read the
        // stable monthly base without seeing variable income as guaranteed.
        income: fixedIncome,
        fixedIncome,
        incomeHistory: { ...(state.incomeHistory || {}), [month]: fixedIncome },
      };
    }

    case 'addVariableIncome': {
      const amt = Math.min(99999999, toFloat(a.amt));
      if (!amt) return state;
      const label = ((a.label || '').trim() || 'Variable income').slice(0, 80);
      const entry = {
        id: uid('income'),
        label,
        amt,
        date: key(startOfToday()),
        status: a.status === 'expected' ? 'expected' : 'received',
      };
      return {
        ...state,
        variableIncomes: (state.variableIncomes || []).concat(entry),
        notice: {
          id: uid('notice'),
          message: entry.status === 'expected' ? `${label} added as expected` : `${label} marked received`,
        },
        undo: null,
      };
    }

    case 'updateVariableIncome':
      return {
        ...state,
        variableIncomes: (state.variableIncomes || []).map((entry) => entry.id === a.id
          ? a.field === 'status'
            ? { ...entry, status: a.value === 'expected' ? 'expected' : 'received' }
            : entry
          : entry),
      };

    case 'removeVariableIncome': {
      const variableIncomes = state.variableIncomes || [];
      const index = variableIncomes.findIndex((entry) => entry.id === a.id);
      const item = variableIncomes[index];
      if (!item) return state;
      return {
        ...state,
        variableIncomes: variableIncomes.filter((entry) => entry.id !== a.id),
        notice: null,
        undo: { id: uid('undo'), kind: 'income', item, index, message: `${item.label} deleted` },
      };
    }

    case 'addBill':
      return {
        ...state,
        bills: state.bills.concat({ id: uid('bill'), name: 'New bill', day: 1, amt: 0 }),
        notice: { id: uid('notice'), message: 'Recurring bill added' },
        undo: null,
      };

    case 'updateBill':
      return {
        ...state,
        bills: state.bills.map((bill) => bill.id === a.id
          ? {
              ...bill,
              ...(a.field === 'name'
                ? { name: String(a.value).slice(0, 80) }
                : a.field === 'day'
                  ? { day: Math.min(31, Math.max(1, toInt(a.value))) }
                  : { amt: Math.max(0, toFloat(a.value)) }),
            }
          : bill),
      };

    case 'removeBill': {
      const index = state.bills.findIndex((bill) => bill.id === a.id);
      const item = state.bills[index];
      if (!item) return state;
      return {
        ...state,
        bills: state.bills.filter((bill) => bill.id !== a.id),
        notice: null,
        undo: { id: uid('undo'), kind: 'bill', item, index, message: `${item.name} deleted` },
      };
    }

    case 'drillCategory':
      return { ...state, txnFilter: a.cat, mScreen: 'today' };

    // ── Reset ─────────────────────────────────────────────────────
    case 'reset':
      return initialState(newAccountState(startOfToday()));

    default:
      return state;
  }
}
