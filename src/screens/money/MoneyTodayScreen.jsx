import Screen from '../../components/Screen.jsx';
import SwipeRow from '../../components/SwipeRow.jsx';
import { Avatar, Card, Chip, Label, Meter, Mono, PrimaryButton, ScreenTitle, EmptyNote } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { daysLeftInMonth, totalBudget, totalSpent, transactionsForMonth } from '../../store/selectors.js';
import { categoryLabel } from '../../data/money.js';
import { MON_SHORT, key, monthLabel, startOfToday } from '../../lib/date.js';
import { money, money0 } from '../../lib/format.js';
import { MNY, MONO, ON_MNY, WARN, dim } from '../../lib/theme.js';

const ALL = 'Todo';
const QUICK_FILTERS = [ALL, 'Mercado', 'Comer fuera', 'Transporte'];

export default function MoneyTodayScreen() {
  const { state, dispatch, patch } = useApp();
  const today = startOfToday();

  const budget = totalBudget(state.budgets);
  const spent = totalSpent(state.txns);
  const monthTxns = transactionsForMonth(state.txns, today);
  const spentToday = monthTxns.filter((t) => t.date === key(today)).reduce((a, t) => a + t.amt, 0);
  const daysLeft = daysLeftInMonth(today);
  const over = spent > budget;

  const shown = state.txnFilter === ALL ? monthTxns : monthTxns.filter((t) => t.cat === state.txnFilter);

  const todayKey = key(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = key(yesterday);
  const dayLabel = (date) => date === todayKey
    ? 'TODAY'
    : date === yesterdayKey
      ? 'YESTERDAY'
      : `${date.slice(-2)} ${MON_SHORT[today.getMonth()]}`;

  // Newest day first, and newest entry first within each day.
  const days = [...new Set(shown.map((t) => t.date))]
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({
      date,
      label: dayLabel(date),
      items: shown.filter((t) => t.date === date).reverse(),
    }));
  const initials = state.profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'ME';

  return (
    <Screen>
      <ScreenTitle
        eyebrow={`${monthLabel(today)} · DAY ${today.getDate()}`}
        title="Spending"
        right={<Avatar initials={initials} onClick={() => dispatch({ type: 'openProfile' })} />}
      />

      <Card style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Label color={MNY}>AVAILABLE THIS MONTH</Label>
          <Mono color={dim(0.6)}>
            {money0(spent)} / {money0(budget)}
          </Mono>
        </div>
        <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: -3, lineHeight: 1, margin: '8px 0 16px' }}>
          {money0(Math.max(0, budget - spent))}
        </div>
        <Meter
          value={`${Math.min(100, Math.round((spent / (budget || 1)) * 100))}%`}
          color={over ? WARN : MNY}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 18 }}>
          <Cell label="TODAY" value={money0(spentToday)} />
          <Cell label="PER DAY" value={money0(Math.max(0, (budget - spent) / daysLeft))} />
          <Cell label="LEFT" value={`${daysLeft} days`} />
        </div>
      </Card>

      <PrimaryButton
        background={MNY}
        color={ON_MNY}
        height={56}
        style={{ marginTop: 14, borderRadius: 16 }}
        onClick={() => dispatch({ type: 'openAddTxn' })}
      >
        Add expense
      </PrimaryButton>

      {state.favs.length > 0 && (
        <>
          <Label style={{ marginTop: 24 }}>ONE TAP</Label>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {state.favs.map((f) => (
              <button
                key={f.label}
                className="outline-mny"
                onClick={() => dispatch({ type: 'addTxn', amt: f.amt, label: f.label, cat: f.cat })}
                style={{
                  height: 48,
                  padding: '0 16px',
                  borderRadius: 14,
                  border: `1px solid ${dim(0.14)}`,
                  background: dim(0.05),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'border-color .2s',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500 }}>{f.label}</span>
                <Mono size={13} color={dim(0.55)}>
                  {money(f.amt)}
                </Mono>
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 28, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Label>TRANSACTIONS</Label>
        <Mono color={dim(0.5)}>
          {money0(shown.reduce((a, t) => a + t.amt, 0))}
          {state.txnFilter === ALL ? ' this month' : ` in ${categoryLabel(state.txnFilter)}`}
        </Mono>
      </div>

      <div aria-label="Transaction filters" style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {QUICK_FILTERS.map((c) => (
          <Chip
            key={c}
            label={c === ALL ? 'All' : categoryLabel(c)}
            selected={state.txnFilter === c}
            onClick={() => patch({ txnFilter: c })}
          />
        ))}
        <Chip
          label={QUICK_FILTERS.includes(state.txnFilter)
            ? 'More filters'
            : `More · ${categoryLabel(state.txnFilter)}`}
          selected={!QUICK_FILTERS.includes(state.txnFilter)}
          accent={MNY}
          onClick={() => dispatch({ type: 'openTxnFilters' })}
        />
      </div>

      {days.map((d) => (
        <section key={d.date} className="ledger-day" style={{ marginTop: 22 }} aria-label={d.label.toLowerCase()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Label>{d.label}</Label>
            <Mono color={dim(0.55)}>{money0(d.items.reduce((a, t) => a + t.amt, 0))}</Mono>
          </div>
          {d.items.map((t) => (
            <SwipeRow
              key={t.id}
              id={t.id}
              deleteLabel={`Delete ${t.label}`}
              onDelete={() => dispatch({ type: 'removeTxn', id: t.id })}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: `1px solid ${dim(0.07)}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: MNY }} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}>{t.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: dim(0.56), marginTop: 3 }}>
                      {categoryLabel(t.cat)}
                    </div>
                  </div>
                </div>
                <Mono size={13} color={dim(0.75)} style={{ paddingLeft: 14 }}>
                  {money(t.amt)}
                </Mono>
              </div>
            </SwipeRow>
          ))}
        </section>
      ))}

      {days.length === 0 && (
        <div style={{ marginTop: 18 }}>
          <EmptyNote>No transactions match this filter.</EmptyNote>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {state.txnFilter !== ALL && (
              <button
                className="outline"
                onClick={() => patch({ txnFilter: ALL })}
                style={{ flex: 1, minHeight: 48, border: `1px solid ${dim(0.16)}`, borderRadius: 14, textAlign: 'center' }}
              >
                Clear filter
              </button>
            )}
            <button
              className="outline-mny"
              onClick={() => dispatch({ type: 'openAddTxn' })}
              style={{ flex: 1, minHeight: 48, border: `1px solid ${MNY}`, borderRadius: 14, color: MNY, textAlign: 'center' }}
            >
              Add expense
            </button>
          </div>
        </div>
      )}
    </Screen>
  );
}

function Cell({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1.1, color: dim(0.58) }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 14, marginTop: 4 }}>{value}</div>
    </div>
  );
}
