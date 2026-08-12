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
  const { state, dispatch } = useApp();
  const health = state.module === 'health';
  const locked = !health && state.locked;

  const Current = health ? HEALTH_SCREENS[state.screen] : MONEY_SCREENS[state.mScreen];

  return (
    <PhoneShell>
      <ModuleSwitch module={state.module} onChange={(m) => dispatch({ type: 'module', module: m })} />

      {!locked && Current && <Current />}

      {health ? (
        // "You" is reached from the avatar, not the tab bar, so nothing is
        // highlighted while it is open.
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
      )}

      {locked && <LockScreen />}

      {health && state.sheet && <FoodSheet />}
      {health && state.pickSheet && <SessionPickSheet />}
      {health && state.editSheet && <SessionEditSheet />}
      {health && state.dayMenu && <DayMenuSheet />}
      {!health && !locked && state.addSheet && <AddExpenseSheet />}
    </PhoneShell>
  );
}
