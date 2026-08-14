import Screen from '../../components/Screen.jsx';
import { Card, EmptyNote, GhostButton, Label, MetricBand, Mono, SegmentedControl } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { incomeSummary, spentByCategory, totalSpent } from '../../store/selectors.js';
import { MON_SHORT, startOfToday } from '../../lib/date.js';
import { money0 } from '../../lib/format.js';
import { INK, MNY, MONO, WARN, dim } from '../../lib/theme.js';
import { categoryLabel } from '../../data/money.js';

const WINDOW = 6;

export default function MoneyStatsScreen() {
  const { state, dispatch, patch } = useApp();
  const today = startOfToday();
  const saved = state.statMode === 'saved';

  // The current month is live from transactions; earlier months come from the
  // rolled-up history so the chart does not need every past transaction.
  const months = [];
  for (let i = WINDOW - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      label: MON_SHORT[d.getMonth()],
      year: d.getFullYear(),
      spent: totalSpent(state.txns, d) || state.monthHist[ym] || 0,
      income: incomeSummary(state, d),
    });
  }

  // Never backfill the current income into earlier months. Cash left is only
  // knowable when that month's fixed base was actually recorded.
  const series = months.map((month) => (
    saved
      ? month.income.hasKnownBase ? month.income.confirmed - month.spent : null
      : month.spent
  ));
  const knownSeries = series.filter((value) => Number.isFinite(value));
  const maxSer = Math.max(...knownSeries.map((value) => Math.max(0, value)), 1);
  const avg = knownSeries.length ? knownSeries.reduce((sum, value) => sum + value, 0) / knownSeries.length : 0;

  const sel = Math.min(state.statSel, series.length - 1);
  const selectedValue = series[sel];
  const prev = sel > 0 && Number.isFinite(series[sel - 1]) ? series[sel - 1] : null;
  const deltaPct = prev !== null && Number.isFinite(selectedValue)
    ? Math.round(((selectedValue - prev) / (Math.abs(prev) || 1)) * 100)
    : 0;
  // For spending, down is good; for saving, up is.
  const good = saved ? deltaPct >= 0 : deltaPct <= 0;
  const vsAvg = Number.isFinite(selectedValue)
    ? Math.round(((selectedValue - avg) / (Math.abs(avg) || 1)) * 100)
    : 0;
  const deltaColor = prev === null ? dim(0.6) : good ? MNY : WARN;

  const spent = totalSpent(state.txns);
  const currentIncome = incomeSummary(state, today);
  const cashLeft = currentIncome.confirmed - spent;
  const hasFinancialData = spent > 0
    || currentIncome.confirmed > 0
    || currentIncome.expectedVariable > 0
    || Object.values(state.monthHist).some((value) => Number(value) > 0);
  const byCat = spentByCategory(state).sort((a, b) => b.spent - a.spent);
  const maxCat = byCat[0]?.spent || 1;

  return (
    <Screen>
      <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Statistics</h1>
      <Label style={{ marginTop: 6 }}>LAST {WINDOW} MONTHS</Label>

      <SegmentedControl
        style={{ marginTop: 18, borderRadius: 15 }}
        value={state.statMode}
        onChange={(v) => patch({ statMode: v })}
        options={[
          { value: 'spend', label: 'Spending' },
          { value: 'saved', label: 'Cash left' },
        ]}
      />

      {!hasFinancialData ? (
        <EmptyNote
          title="No spending history yet"
          style={{ marginTop: 18 }}
          action={(
            <GhostButton className="outline-mny" style={{ width: '100%', color: MNY, borderColor: MNY }} onClick={() => dispatch({ type: 'openAddTxn' })}>
              Add your first expense
            </GhostButton>
          )}
        >
          Your six-month view and category breakdown will appear as you add expenses.
        </EmptyNote>
      ) : <Card style={{ marginTop: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <Label color={MNY}>
              {months[sel].label} {months[sel].year} · {saved ? (Number.isFinite(selectedValue) ? 'CASH LEFT' : 'INCOME NOT RECORDED') : 'SPENT'}
            </Label>
            <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -2, lineHeight: 1, marginTop: 8 }}>
              {Number.isFinite(selectedValue) ? money0(selectedValue) : '—'}
            </div>
          </div>
          <Mono size={12} color={deltaColor}>
            {!Number.isFinite(selectedValue)
              ? 'cash left unavailable'
              : prev === null
                ? 'no prior comparison'
              : `${deltaPct >= 0 ? '+' : ''}${deltaPct}% vs ${months[sel - 1].label}`}
          </Mono>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 8, height: 118, marginTop: 20, borderBottom: `1px solid ${dim(0.12)}` }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${Math.max(2, Math.min(98, (avg / maxSer) * 100))}%`,
              borderTop: `1px dashed ${dim(0.18)}`,
              pointerEvents: 'none',
            }}
          >
            <span style={{ position: 'absolute', right: 0, top: -16, fontFamily: MONO, fontSize: 10.5, color: dim(0.5) }}>AVG</span>
          </div>
          {series.map((value, i) => (
            <button
              key={i}
              onClick={() => patch({ statSel: i })}
              aria-label={`${months[i].label} ${months[i].year}: ${Number.isFinite(value) ? money0(value) : 'income not recorded'}`}
              style={{
                flex: 1,
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                height: '100%',
                paddingTop: 6,
              }}
            >
              <div
                style={{
                  borderRadius: '12px 12px 0 0',
                  height: '100%',
                  transform: `scaleY(${Number.isFinite(value) ? Math.max(0.04, Math.max(0, value) / maxSer) : 0.025})`,
                  transformOrigin: 'bottom center',
                  transition: 'background .25s, transform .25s cubic-bezier(.2,.8,.2,1)',
                  background: Number.isFinite(value) ? (i === sel ? MNY : dim(0.18)) : dim(0.08),
                }}
              />
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {months.map((m, i) => (
            <button
              key={i}
              onClick={() => patch({ statSel: i })}
              style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: MONO,
                fontSize: 12,
                transition: 'color .25s',
                color: i === sel ? INK : dim(0.58),
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 14,
            borderTop: `1px solid ${dim(0.08)}`,
          }}
        >
          <Foot label={`${WINDOW}M AVERAGE`} value={knownSeries.length ? money0(avg) : '—'} />
          <Foot label="HIGHEST" value={knownSeries.length ? money0(Math.max(...knownSeries)) : '—'} />
          <Foot
            label="VS AVERAGE"
            value={Number.isFinite(selectedValue) ? `${vsAvg >= 0 ? '+' : ''}${vsAvg}%` : '—'}
            color={deltaColor}
          />
        </div>
        {saved && months.some((month) => !month.income.hasKnownBase) && (
          <div style={{ color: dim(0.58), fontSize: 12.5, lineHeight: 1.4, marginTop: 12 }}>
            Cash left appears only for months with a recorded income base.
          </div>
        )}
      </Card>}

      {hasFinancialData && (
        <MetricBand
          style={{ marginTop: 16 }}
          items={[
            {
              label: 'CASH LEFT THIS MONTH',
              value: money0(cashLeft),
              color: cashLeft < 0 ? WARN : MNY,
            },
            {
              label: 'OF CONFIRMED INCOME',
              value: `${Math.round((Math.max(0, cashLeft) / (currentIncome.confirmed || 1)) * 100)}%`,
              color: dim(0.62),
            },
          ]}
        />
      )}

      {hasFinancialData && currentIncome.expectedVariable > 0 && (
        <div style={{ color: dim(0.6), fontSize: 12.5, lineHeight: 1.4, marginTop: 10 }}>
          {money0(currentIncome.expectedVariable)} expected variable income is excluded until received.
        </div>
      )}

      {hasFinancialData && <><div style={{ marginTop: 26, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Label>WHERE IT WENT</Label>
        <Label color={dim(0.6)}>TAP TO FILTER</Label>
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {byCat.filter((c) => c.spent > 0).map((c) => (
          <button
            key={c.cat}
            onClick={() => dispatch({ type: 'drillCategory', cat: c.cat })}
            style={{ width: '100%' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 7,
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: state.txnFilter === c.cat ? INK : dim(0.9),
                }}
              >
                {categoryLabel(c.cat)}
              </span>
              <Mono size={13} color={dim(0.6)}>
                {money0(c.spent)} · {Math.round((c.spent / (spent || 1)) * 100)}%
              </Mono>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: dim(0.09), overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  transform: `scaleX(${c.spent / maxCat})`,
                  transformOrigin: 'left center',
                  transition: 'transform .45s cubic-bezier(.2,.8,.2,1)',
                  background: state.txnFilter === c.cat ? INK : MNY,
                }}
              />
            </div>
          </button>
        ))}
      </div>
      </>}
    </Screen>
  );
}

function Foot({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1.1, color: dim(0.6) }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 14, marginTop: 4, color: color || undefined }}>{value}</div>
    </div>
  );
}
