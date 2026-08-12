import { useEffect, useState } from 'react';
import ModuleSwitch from './components/ModuleSwitch.jsx';
import PhoneShell from './components/PhoneShell.jsx';
import TabBar, { HEALTH_TABS, MONEY_TABS } from './components/TabBar.jsx';
import { useApp } from './store/AppProvider.jsx';

import TodayScreen from './screens/health/TodayScreen.jsx';
import FoodScreen from './screens/health/FoodScreen.jsx';
import TrainScreen from './screens/health/TrainScreen.jsx';
import PlanScreen from './screens/health/PlanScreen.jsx';
import StatsScreen from './screens/health/StatsScreen.jsx';
import YouScreen from './screens/health/YouScreen.jsx';

import MoneyTodayScreen from './screens/money/MoneyTodayScreen.jsx';
import BudgetScreen from './screens/money/BudgetScreen.jsx';
import MoneyPlanScreen from './screens/money/MoneyPlanScreen.jsx';
import MoneyStatsScreen from './screens/money/MoneyStatsScreen.jsx';
import LockScreen from './screens/money/LockScreen.jsx';

import FoodSheet from './sheets/FoodSheet.jsx';
import SessionPickSheet from './sheets/SessionPickSheet.jsx';
import SessionEditSheet from './sheets/SessionEditSheet.jsx';
import AddExpenseSheet from './sheets/AddExpenseSheet.jsx';
import DayMenuSheet from './sheets/DayMenuSheet.jsx';
import TransactionFilterSheet from './sheets/TransactionFilterSheet.jsx';
import { MNY, NUT, TRN, WARN, dim } from './lib/theme.js';

const HEALTH_SCREENS = {
  today: TodayScreen,
  food: FoodScreen,
  train: TrainScreen,
  plan: PlanScreen,
  stats: StatsScreen,
  you: YouScreen,
};

const MONEY_SCREENS = {
  today: MoneyTodayScreen,
  budget: BudgetScreen,
  plan: MoneyPlanScreen,
  stats: MoneyStatsScreen,
};

export default function App() {
  const { state, sync, dispatch, retrySync } = useApp();
  const health = state.module === 'health';
  const locked = !health && state.locked;

  const Current = state.profileOpen
    ? YouScreen
    : health
      ? HEALTH_SCREENS[state.screen]
      : MONEY_SCREENS[state.mScreen];

  return (
    <PhoneShell>
      <div id="app-surface" style={{ display: 'contents' }}>
        <ModuleSwitch module={state.module} onChange={(m) => dispatch({ type: 'module', module: m })} />

        {!locked && Current && <Current />}

        {!state.profileOpen && (health ? (
          <TabBar
            tabs={HEALTH_TABS}
            active={state.screen}
            onSelect={(id) => dispatch({ type: 'screen', screen: id })}
          />
        ) : (
          !locked && (
            <TabBar
              tabs={MONEY_TABS}
              active={state.mScreen}
              onSelect={(id) => dispatch({ type: 'moneyScreen', screen: id })}
            />
          )
        ))}

        {locked && <LockScreen />}
      </div>

      {health && state.sheet && <FoodSheet />}
      {health && state.pickSheet && <SessionPickSheet />}
      {health && state.editSheet && <SessionEditSheet />}
      {health && state.dayMenu && <DayMenuSheet />}
      {!health && !locked && state.addSheet && <AddExpenseSheet />}
      {!health && !locked && state.txnFiltersOpen && <TransactionFilterSheet />}

      <SaveStatus sync={sync} retry={retrySync} />
      <ActionToast state={state} dispatch={dispatch} />
    </PhoneShell>
  );
}

function SaveStatus({ sync, retry }) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (sync.status !== 'saved') {
      setShowSaved(false);
      return undefined;
    }
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 1800);
    return () => clearTimeout(timer);
  }, [sync.lastSyncedAt, sync.status]);

  if (sync.status === 'saving') {
    return <div className="save-status" role="status">Saving…</div>;
  }
  if (sync.status === 'error') {
    const conflict = sync.errorSource === 'conflict';
    return (
      <div className="save-status save-status-error" role="alert">
        <span>{conflict ? 'Newer record found' : 'Couldn’t save'}</span>
        <button
          onClick={() => {
            if (!conflict || window.confirm('Reload the latest cloud record? Unsaved changes in this session will be replaced.')) {
              void retry();
            }
          }}
        >
          {conflict ? 'Reload latest' : 'Retry'}
        </button>
      </div>
    );
  }
  if (!showSaved) return null;
  return <div className="save-status" role="status">Saved</div>;
}

function ActionToast({ state, dispatch }) {
  const current = state.undo || state.notice;
  const undoColor = state.undo?.kind === 'food'
    ? NUT
    : state.undo?.kind === 'template'
      ? TRN
      : MNY;

  useEffect(() => {
    if (!current) return undefined;
    const timer = setTimeout(
      () => dispatch({ type: state.undo ? 'dismissUndo' : 'dismissNotice' }),
      state.undo ? 6000 : 3200,
    );
    return () => clearTimeout(timer);
  }, [current, dispatch, state.undo]);

  if (!current) return null;
  return (
    <div className="action-toast" role="status" aria-live="polite">
      <span>{current.message}</span>
      {state.undo && (
        <button onClick={() => dispatch({ type: 'undoLast' })} style={{ color: undoColor }}>
          Undo
        </button>
      )}
      <button
        aria-label="Dismiss notification"
        onClick={() => dispatch({ type: state.undo ? 'dismissUndo' : 'dismissNotice' })}
        style={{ color: state.undo ? dim(0.68) : WARN }}
      >
        Close
      </button>
    </div>
  );
}
