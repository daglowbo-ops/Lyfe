import Screen from '../../components/Screen.jsx';
import { Label, Mono, Panel, SegmentedControl } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { spendByDay, totalBudget, upcomingBills } from '../../store/selectors.js';
import {
  DOWS, addMonths, daysInMonth, key, monthGrid, monthLabel, startOfToday,
} from '../../lib/date.js';
import { money, money0 } from '../../lib/format.js';
import { MNY, MONO, WARN, dim, input } from '../../lib/theme.js';
import { categoryLabel } from '../../data/money.js';

export default function MoneyPlanScreen() {
  const { state, patch } = useApp();
  const today = startOfToday();

  return (
    <Screen>
      <Label>{monthLabel(state.mPlanMode === 'month' ? addMonths(today, state.mCalOff) : today)}</Label>
      <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1, margin: '5px 0 0' }}>Calendar</h1>
      <SegmentedControl
        style={{ marginTop: 18, borderRadius: 15 }}
        value={state.mPlanMode}
        onChange={(v) => patch({ mPlanMode: v })}
        options={[
          { value: 'month', label: 'Month' },
          { value: 'bills', label: 'Bills' },
        ]}
      />
      {state.mPlanMode === 'month' ? <MonthView /> : <BillsView />}
    </Screen>
  );
}

function MonthView() {
  const { state, patch } = useApp();
  const today = startOfToday();
  const monthStart = addMonths(today, state.mCalOff);
  const perDay = spendByDay(state.txns, monthStart);
  const maxDay = Math.max(1, ...perDay);
  const budget = totalBudget(state.budgets);
  const dailyPace = budget / daysInMonth(monthStart);

  const selected = state.txns.filter((t) => t.date === state.mSel);
  const selTotal = selected.reduce((a, t) => a + t.amt, 0);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
        <Arrow label="Previous month" onClick={() => {
          const next = addMonths(today, state.mCalOff - 1);
          patch({ mCalOff: state.mCalOff - 1, mSel: key(next) });
        }}>
          ‹
        </Arrow>
        <Mono size={12} color={dim(0.7)} style={{ letterSpacing: 1.6 }}>
          {monthLabel(monthStart)}
        </Mono>
        <Arrow
          label="Next month"
          disabled={state.mCalOff >= 0}
          onClick={() => {
            const offset = Math.min(0, state.mCalOff + 1);
            const next = addMonths(today, offset);
            patch({ mCalOff: offset, mSel: key(next) });
          }}
        >
          ›
        </Arrow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginTop: 16 }}>
        {DOWS.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: 0.6,
              color: dim(0.58),
              paddingBottom: 8,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {monthGrid(monthStart).map((d) => {
          const inMonth = d.getMonth() === monthStart.getMonth();
          const dn = d.getDate();
          const dateKey = key(d);
          const v = inMonth ? perDay[dn - 1] : 0;
          return (
            <button
              key={d.toISOString()}
              onClick={() => inMonth && patch({ mSel: dateKey })}
              style={{
                aspectRatio: '1',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '6px 0 7px',
                gap: 5,
                transition: 'background .2s',
                opacity: inMonth ? 1 : 0.25,
                background: inMonth && state.mSel === dateKey ? dim(0.13) : 'transparent',
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: dateKey === key(today) ? MNY : dim(0.85),
                }}
              >
                {dn}
              </span>
              <span style={{ width: 16, height: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span
                  style={{
                    width: 16,
                    borderRadius: 2,
                    height: v > 0 ? `${Math.max(14, Math.round((v / maxDay) * 100))}%` : 0,
                    background: v > dailyPace * 1.6 ? WARN : MNY,
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <Panel style={{ marginTop: 20 }}>
        <Label>
          {state.mSel.slice(-2)} {monthLabel(monthStart)}
        </Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -1.2 }}>{money0(selTotal)}</div>
          <div style={{ fontSize: 13, color: dim(0.62) }}>
            {selected.length === 1 ? '1 transaction' : `${selected.length} transactions`}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${dim(0.07)}`,
          }}
        >
          <div style={{ height: 4, flex: 1, borderRadius: 2, background: dim(0.09), overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: '100%',
                transform: `scaleX(${Math.min(1, selTotal / (dailyPace || 1))})`,
                transformOrigin: 'left center',
                transition: 'transform .4s',
                background: selTotal > dailyPace ? WARN : MNY,
              }}
            />
          </div>
          <Mono size={10} color={selTotal > dailyPace ? WARN : MNY} style={{ whiteSpace: 'nowrap' }}>
            {selTotal === 0
              ? 'no spending'
              : selTotal <= dailyPace
                ? 'below daily pace'
                : `${Math.round((selTotal / dailyPace) * 100)}% of daily pace`}
          </Mono>
        </div>

        {selected.length > 0 ? (
          <div style={{ marginTop: 8 }}>
            {[...selected].reverse().map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: `1px solid ${dim(0.06)}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: MNY, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: -0.2 }}>{t.label}</div>
                    <Mono size={12} color={dim(0.58)} style={{ marginTop: 2, display: 'block' }}>
                      {categoryLabel(t.cat)}
                    </Mono>
                  </div>
                </div>
                <Mono size={13} color={dim(0.7)} style={{ paddingLeft: 12 }}>
                  {money(t.amt)}
                </Mono>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 14, fontSize: 14, color: dim(0.6) }}>
            {state.mSel > key(today) ? 'Future day · no spending yet' : 'No spending that day'}
          </div>
        )}
      </Panel>
    </div>
  );
}

function BillsView() {
  const { state, dispatch } = useApp();
  const today = startOfToday();
  const bills = upcomingBills(state.bills, today);
  const total = bills.reduce((a, b) => a + b.amt, 0);

  return (
    <div className="fade-in" style={{ marginTop: 20 }}>
      <Label style={{ marginBottom: 12 }}>
        {money0(total)} STILL DUE THIS MONTH
      </Label>
      {state.bills.slice().sort((a, b) => a.day - b.day).map((b) => (
        <div
          key={b.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            marginBottom: 8,
            borderRadius: 16,
            border: `1px solid ${dim(0.09)}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              aria-label="Bill name"
              value={b.name}
              maxLength={80}
              onChange={(event) => dispatch({ type: 'updateBill', id: b.id, field: 'name', value: event.target.value })}
              style={{ ...input, width: '100%', height: 44, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <label style={{ width: 82 }}>
                <Label size={9} style={{ marginBottom: 5 }}>DAY</Label>
                <input
                  aria-label={`Day of month for ${b.name}`}
                  type="number"
                  min="1"
                  max="31"
                  value={b.day}
                  onChange={(event) => dispatch({ type: 'updateBill', id: b.id, field: 'day', value: event.target.value })}
                  style={{ ...input, width: '100%', height: 44, padding: '0 10px', fontFamily: MONO, boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ flex: 1, minWidth: 0 }}>
                <Label size={9} style={{ marginBottom: 5 }}>AMOUNT · BS</Label>
                <input
                  aria-label={`Amount for ${b.name}`}
                  type="number"
                  inputMode="decimal"
                  value={b.amt}
                  onChange={(event) => dispatch({ type: 'updateBill', id: b.id, field: 'amt', value: event.target.value })}
                  style={{ ...input, width: '100%', minWidth: 0, height: 44, fontFamily: MONO, boxSizing: 'border-box' }}
                />
              </label>
            </div>
          </div>
          <button
            className="muted-link"
            aria-label={`Delete ${b.name}`}
            onClick={() => dispatch({ type: 'removeBill', id: b.id })}
            style={{ color: WARN, padding: 10 }}
          >
            Delete
          </button>
        </div>
      ))}
      <button
        className="outline-mny"
        onClick={() => dispatch({ type: 'addBill' })}
        style={{ width: '100%', height: 50, borderRadius: 14, border: `1px dashed ${dim(0.18)}`, color: dim(0.65), textAlign: 'center' }}
      >
        Add recurring bill
      </button>
      {bills.length === 0 && <div style={{ fontSize: 14, color: dim(0.5), marginTop: 12 }}>Nothing else is due this month.</div>}
    </div>
  );
}

function Arrow({ children, onClick, disabled, label }) {
  return (
    <button
      className="outline"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        width: 46,
        height: 46,
        borderRadius: 14,
        border: `1px solid ${dim(0.12)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        color: dim(0.6),
        opacity: disabled ? 0.25 : 1,
        transition: 'opacity .2s, border-color .2s, color .2s',
      }}
    >
      {children}
    </button>
  );
}
