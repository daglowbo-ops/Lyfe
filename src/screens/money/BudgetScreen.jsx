import { useState } from 'react';
import Screen from '../../components/Screen.jsx';
import {
  Card, GhostButton, Label, Meter, Mono, Panel, PrimaryButton, SegmentedControl,
} from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { incomeSummary, spentByCategory, totalBudget } from '../../store/selectors.js';
import { monthLabel, startOfToday } from '../../lib/date.js';
import { money0 } from '../../lib/format.js';
import { INK, MNY, MONO, ON_MNY, WARN, dim, input } from '../../lib/theme.js';
import { categoryLabel } from '../../data/money.js';

export default function BudgetScreen() {
  const { state, dispatch } = useApp();
  const [addingIncome, setAddingIncome] = useState(false);
  const [draft, setDraft] = useState({ label: '', amt: '', status: 'received' });
  const today = startOfToday();
  const income = incomeSummary(state, today);
  const budget = totalBudget(state.budgets);
  const rows = spentByCategory(state, today);
  const unassigned = income.confirmed - budget;
  const entries = income.entries.slice().sort((a, b) => b.date.localeCompare(a.date));

  const addIncome = (event) => {
    event.preventDefault();
    if (!(Number.parseFloat(draft.amt) > 0)) return;
    dispatch({ type: 'addVariableIncome', ...draft });
    setDraft({ label: '', amt: '', status: 'received' });
    setAddingIncome(false);
  };

  return (
    <Screen>
      <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Budgets</h1>
      <Label style={{ marginTop: 6 }}>{monthLabel(today)}</Label>

      <Card style={{ marginTop: 20 }}>
        <Label color={MNY}>CONFIRMED INCOME</Label>
        <div style={{ fontSize: 48, fontWeight: 600, letterSpacing: -2.4, lineHeight: 1, marginTop: 8 }}>
          {money0(income.confirmed)}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
            marginTop: 18,
            paddingTop: 15,
            borderTop: `1px solid ${dim(0.09)}`,
          }}
        >
          <IncomeMetric label="FIXED BASE" value={money0(income.fixed)} />
          <IncomeMetric label="VARIABLE RECEIVED" value={money0(income.receivedVariable)} />
        </div>
        {income.expectedVariable > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 16,
              marginTop: 15,
              paddingTop: 14,
              borderTop: `1px solid ${dim(0.09)}`,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <Label color={dim(0.62)} style={{ letterSpacing: 1.05 }}>EXPECTED · NOT AVAILABLE</Label>
              <div style={{ color: dim(0.62), fontSize: 12.5, lineHeight: 1.35, marginTop: 4 }}>
                Excluded until you mark it received.
              </div>
            </div>
            <Mono size={14} color={dim(0.72)} style={{ flexShrink: 0 }}>{money0(income.expectedVariable)}</Mono>
          </div>
        )}
      </Card>

      <Label style={{ marginTop: 26 }}>STABLE BASE</Label>
      <Panel style={{ marginTop: 10 }}>
        <label htmlFor="fixed-income" style={{ display: 'block', fontSize: 16, fontWeight: 500 }}>
          Monthly fixed income
        </label>
        <div style={{ color: dim(0.62), fontSize: 13, lineHeight: 1.4, marginTop: 4 }}>
          Salary or other income you can reliably count on each month.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 52,
            marginTop: 13,
            padding: '0 14px',
            borderRadius: 13,
            border: `1px solid ${dim(0.14)}`,
            background: '#0D0D0C',
          }}
        >
          <Mono size={12} color={dim(0.62)} style={{ marginRight: 8 }}>Bs</Mono>
          <input
            id="fixed-income"
            aria-label="Fixed monthly income in bolivianos"
            type="number"
            inputMode="decimal"
            min="0"
            value={state.fixedIncome ?? state.income ?? 0}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => dispatch({ type: 'setFixedIncome', value: event.target.value })}
            style={{
              width: '100%',
              height: 48,
              border: 0,
              outline: 0,
              background: 'transparent',
              color: INK,
              fontFamily: MONO,
              fontSize: 20,
              fontWeight: 600,
            }}
          />
        </div>
      </Panel>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 26 }}>
        <Label>VARIABLE INCOME</Label>
        <Mono color={dim(0.58)}>{entries.length} this month</Mono>
      </div>
      <div style={{ color: dim(0.62), fontSize: 13, lineHeight: 1.4, marginTop: 6 }}>
        Log freelance work, commissions or irregular income as received or expected.
      </div>

      {entries.length > 0 && (
        <Panel style={{ marginTop: 12, paddingTop: 4, paddingBottom: 4 }}>
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                columnGap: 12,
                padding: '14px 0',
                borderBottom: index === entries.length - 1 ? 'none' : `1px solid ${dim(0.08)}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.label}
                </div>
                <Mono size={13} color={entry.status === 'expected' ? dim(0.62) : MNY} style={{ display: 'block', marginTop: 4 }}>
                  {money0(entry.amt)}
                </Mono>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  aria-label={`${entry.label}: ${entry.status}. Change to ${entry.status === 'expected' ? 'received' : 'expected'}`}
                  onClick={() => dispatch({
                    type: 'updateVariableIncome',
                    id: entry.id,
                    field: 'status',
                    value: entry.status === 'expected' ? 'received' : 'expected',
                  })}
                  style={{
                    minHeight: 44,
                    padding: '0 10px',
                    borderRadius: 12,
                    border: `1px solid ${entry.status === 'expected' ? dim(0.14) : MNY}`,
                    background: entry.status === 'expected' ? 'transparent' : MNY,
                    color: entry.status === 'expected' ? dim(0.7) : ON_MNY,
                    fontSize: 12.5,
                    fontWeight: 500,
                    transition: 'background .2s, color .2s, border-color .2s',
                  }}
                >
                  {entry.status === 'expected' ? 'Expected' : 'Received'}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${entry.label}`}
                  onClick={() => dispatch({ type: 'removeVariableIncome', id: entry.id })}
                  style={{ minWidth: 44, minHeight: 44, color: WARN, fontSize: 12.5 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </Panel>
      )}

      {addingIncome ? (
        <form className="fade-in" onSubmit={addIncome} style={{ marginTop: 12 }}>
          <Panel>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, .75fr)', gap: 8 }}>
              <label>
                <Label style={{ marginBottom: 6, letterSpacing: 1.05 }}>SOURCE</Label>
                <input
                  autoFocus
                  aria-label="Variable income source"
                  value={draft.label}
                  maxLength={80}
                  placeholder="Freelance project"
                  onChange={(event) => setDraft((value) => ({ ...value, label: event.target.value }))}
                  style={{ ...input, width: '100%', boxSizing: 'border-box' }}
                />
              </label>
              <label>
                <Label style={{ marginBottom: 6, letterSpacing: 1.05 }}>AMOUNT · BS</Label>
                <input
                  aria-label="Variable income amount in bolivianos"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={draft.amt}
                  placeholder="0"
                  onChange={(event) => setDraft((value) => ({ ...value, amt: event.target.value }))}
                  style={{ ...input, width: '100%', boxSizing: 'border-box', fontFamily: MONO }}
                />
              </label>
            </div>
            <SegmentedControl
              ariaLabel="Variable income status"
              style={{ marginTop: 12 }}
              value={draft.status}
              onChange={(status) => setDraft((value) => ({ ...value, status }))}
              options={[
                { value: 'received', label: 'Received' },
                { value: 'expected', label: 'Expected' },
              ]}
            />
            <div style={{ color: dim(0.58), fontSize: 12.5, lineHeight: 1.4, marginTop: 8 }}>
              {draft.status === 'received'
                ? 'Received income is included in your confirmed total.'
                : 'Expected income stays outside your confirmed total.'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 8, marginTop: 14 }}>
              <GhostButton type="button" onClick={() => setAddingIncome(false)}>Cancel</GhostButton>
              <PrimaryButton type="submit" background={MNY} color={ON_MNY} disabled={!(Number.parseFloat(draft.amt) > 0)}>
                Add income
              </PrimaryButton>
            </div>
          </Panel>
        </form>
      ) : (
        <GhostButton
          className="outline-mny"
          onClick={() => setAddingIncome(true)}
          style={{ width: '100%', marginTop: 12, color: MNY, borderStyle: 'dashed' }}
        >
          Add variable income
        </GhostButton>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 28 }}>
        <Label>ALLOCATIONS</Label>
        <Label color={unassigned < 0 ? WARN : MNY} style={{ letterSpacing: 1.05, textAlign: 'right' }}>
          {unassigned < 0 ? `${money0(Math.abs(unassigned))} OVER` : `${money0(unassigned)} AVAILABLE`}
        </Label>
      </div>
      <div style={{ color: dim(0.58), fontSize: 12.5, lineHeight: 1.4, marginTop: 5 }}>
        Based on confirmed income only. Expected entries are not assignable yet.
      </div>

      {rows.map((row) => (
        <div
          key={row.cat}
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
              <label htmlFor={`limit-${row.i}`} style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.3 }}>
                {categoryLabel(row.cat)}
              </label>
              <div style={{ fontFamily: MONO, fontSize: 12, marginTop: 4, color: row.over ? WARN : dim(0.75) }}>
                {money0(row.spent)} spent ·{' '}
                {row.over ? `${money0(row.spent - row.limit)} over` : `${money0(row.limit - row.spent)} available`}
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
              <Mono size={12} color={dim(0.6)}>Bs</Mono>
              <input
                id={`limit-${row.i}`}
                type="number"
                inputMode="numeric"
                min="0"
                value={row.limit}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => dispatch({ type: 'setLimit', i: row.i, value: event.target.value })}
                style={{
                  width: 74,
                  height: 44,
                  border: 'none',
                  background: 'transparent',
                  color: INK,
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
              value={`${Math.min(100, Math.round((row.spent / (row.limit || 1)) * 100))}%`}
              color={row.over ? WARN : MNY}
              track={dim(0.09)}
              label={`${categoryLabel(row.cat)} budget used`}
            />
          </div>
        </div>
      ))}
    </Screen>
  );
}

function IncomeMetric({ label, value }) {
  return (
    <div>
      <Mono size={15} color={INK}>{value}</Mono>
      <Label style={{ marginTop: 5, letterSpacing: 1.05 }}>{label}</Label>
    </div>
  );
}
