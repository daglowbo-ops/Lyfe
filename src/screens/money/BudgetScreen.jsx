import Screen from '../../components/Screen.jsx';
import { Label, Meter, Mono, Panel } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { spentByCategory, totalBudget } from '../../store/selectors.js';
import { money0 } from '../../lib/format.js';
import { MNY, MONO, WARN, dim } from '../../lib/theme.js';
import { categoryLabel } from '../../data/money.js';

export default function BudgetScreen() {
  const { state, dispatch } = useApp();
  const budget = totalBudget(state.budgets);
  const rows = spentByCategory(state);
  const unassigned = state.income - budget;

  return (
    <Screen>
      <Label>MONTHLY PLAN</Label>
      <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1, margin: '5px 0 0' }}>Budgets</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
        <Panel>
          <Label color={dim(0.6)} style={{ letterSpacing: 1.1, marginBottom: 7 }}>MONTHLY INCOME</Label>
          <input
            aria-label="Monthly income in bolivianos"
            type="number"
            inputMode="decimal"
            value={state.income}
            onChange={(event) => dispatch({ type: 'setIncome', value: event.target.value })}
            style={{ width: '100%', border: 0, outline: 0, background: 'transparent', color: 'inherit', fontFamily: MONO, fontSize: 22, fontWeight: 600 }}
          />
        </Panel>
        <Panel>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -1.2 }}>{money0(budget)}</div>
          <Label color={MNY} style={{ letterSpacing: 1.1, marginTop: 5 }}>
            ASSIGNED
          </Label>
        </Panel>
      </div>

      <Label color={unassigned < 0 ? WARN : undefined} style={{ margin: '24px 0 4px' }}>
        {unassigned < 0 ? `${money0(Math.abs(unassigned))} OVER-ASSIGNED` : `${money0(unassigned)} UNASSIGNED`}
      </Label>

      {rows.map((r) => (
        <div
          key={r.cat}
          style={{
            border: `1px solid ${dim(0.06)}`,
            borderRadius: 18,
            padding: 16,
            marginTop: 10,
            background: '#111110',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <label
                htmlFor={`limit-${r.i}`}
                style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.3 }}
              >
                {categoryLabel(r.cat)}
              </label>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  marginTop: 4,
                  color: r.over ? WARN : dim(0.75),
                }}
              >
                {money0(r.spent)} spent ·{' '}
                {r.over ? `${money0(r.spent - r.limit)} over` : `${money0(r.limit - r.spent)} available`}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                height: 48,
                padding: '0 12px',
                borderRadius: 13,
                border: `1px solid ${dim(0.14)}`,
                background: '#0D0D0C',
              }}
            >
              <Mono size={12} color={dim(0.6)}>
                Bs
              </Mono>
              <input
                id={`limit-${r.i}`}
                type="number"
                inputMode="numeric"
                value={r.limit}
                onChange={(e) => dispatch({ type: 'setLimit', i: r.i, value: e.target.value })}
                style={{
                  width: 74,
                  height: 44,
                  border: 'none',
                  background: 'transparent',
                  color: '#E9E5DC',
                  textAlign: 'right',
                  fontFamily: MONO,
                  fontSize: 16,
                  outline: 'none',
                  padding: 0,
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Meter
              height={4}
              value={`${Math.min(100, Math.round((r.spent / (r.limit || 1)) * 100))}%`}
              color={r.over ? WARN : MNY}
              track={dim(0.09)}
            />
          </div>
        </div>
      ))}
    </Screen>
  );
}
