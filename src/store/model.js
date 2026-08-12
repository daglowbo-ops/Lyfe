import { freshCopy, seedWorkout } from '../data/templates.js';
import { dayTotals, workoutTotals } from './selectors.js';

function workoutForPlan(state, dateKey) {
  const planned = state.plan?.[dateKey];
  const template = state.templates?.find((item) => item.name === planned)
    || state.templates?.find((item) => item.name === state.curName)
    || state.templates?.[0];
  return template
    ? { name: template.name, exercises: freshCopy(template.exercises) }
    : { name: 'Workout', exercises: seedWorkout() };
}

/** Close the previous local day and open the requested one without losing data. */
export function rolloverData(state, nextDate) {
  if (!state.activeDate || state.activeDate === nextDate) return { ...state, activeDate: nextDate };

  const totals = dayTotals(state.meals || []);
  const workout = workoutTotals(state.workout || []);
  const dailyLogs = {
    ...(state.dailyLogs || {}),
    [state.activeDate]: {
      meals: state.meals || [],
      workout: state.workout || [],
      curName: state.curName,
      sessionFinished: Boolean(state.sessionFinished),
    },
  };
  const hist = {
    ...(state.hist || {}),
    [state.activeDate]: {
      ...(state.hist?.[state.activeDate] || {}),
      kcal: totals.kcal,
      p: totals.p,
      trained: Boolean(state.sessionFinished || workout.done > 0),
    },
  };

  const saved = dailyLogs[nextDate];
  const fresh = workoutForPlan(state, nextDate);
  return {
    ...state,
    activeDate: nextDate,
    dailyLogs,
    hist,
    meals: saved?.meals || [],
    workout: saved?.workout?.length ? saved.workout : fresh.exercises,
    curName: saved?.curName || fresh.name,
    sessionFinished: Boolean(saved?.sessionFinished),
    resting: false,
    restLeft: 0,
    sheet: false,
    pickSheet: false,
    editSheet: false,
    dayMenu: null,
    addSheet: false,
  };
}
