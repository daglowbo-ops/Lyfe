import Screen from '../../components/Screen.jsx';
import { Card, Label, Mono, Panel, SegmentedControl } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { spentByCategory, totalSpent } from '../../store/selectors.js';
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
    });
  }

  const series = months.map((m) => (saved ? Math.max(0, state.income - m.spent) : m.spent));
  const maxSer = Math.max(...series, 1);
  const avg = series.reduce((a, v) => a + v, 0) / series.length;

  const sel = Math.min(state.statSel, series.length - 1);
  const prev = sel > 0 ? series[sel - 1] : null;
  const deltaPct = prev ? Math.round(((series[sel] - prev) / (prev || 1)) * 100) : 0;
  // For spending, down is good; for saving, up is.
  const good = saved ? deltaPct >= 0 : deltaPct <= 0;
  const vsAvg = Math.round(((series[sel] - avg) / (avg || 1)) * 100);
  const deltaColor = prev === null ? dim(0.4) : good ? MNY : WARN;

  const spent = totalSpent(state.txns);
  const byCat = spentByCategory(state).sort((a, b) => b.spent - a.spent);
  const maxCat = byCat[0]?.spent || 1;

  return (
    <Screen>
      <Label>LAST {WINDOW} MONTHS</Label>
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1, marginTop: 5 }}>Statistics</div>

      <SegmentedControl
        style={{ marginTop: 18, borderRadius: 15 }}
        value={state.statMode}
        onChange={(v) => patch({ statMode: v })}
        options={[
          { value: 'spend', label: 'Spending' },
          { value: 'saved', label: 'Saved' },
        ]}
      />

      <Card style={{ marginTop: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <Label color={MNY}>
              {months[sel].label} {months[sel].year} · {saved ? 'SAVED' : 'SPENT'}
            </Label>
            <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -2, lineHeight: 1, marginTop: 8 }}>
              {money0(series[sel])}
            </div>
          </div>
          <Mono size={12} color={deltaColor}>
            {prev === null
              ? 'first month'
              : `${deltaPct >= 0 ? '+' : ''}${deltaPct}% vs ${months[sel - 1].label}`}
          </Mono>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 118, marginTop: 20 }}>
          {series.map((v, i) => (
            <button
              key={i}
              onClick={() => patch({ statSel: i })}
              aria-label={`${months[i].label} ${months[i].year}: ${money0(v)}`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                height: '100%',
                paddingTop: 6,
              }}
            >
              <div
                style={{
                  borderRadius: '5px 5px 2px 2px',
                  height: `${Math.max(4, Math.round((v / maxSer) * 100))}%`,
                  transition: 'background .25s',
                  background: i === sel ? MNY : dim(0.18),
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
                fontSize: 10.5,
                transition: 'color .25s',
                color: i === sel ? INK : dim(0.32),
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
          <Foot label={`${WINDOW}M AVERAGE`} value={money0(avg)} />
          <Foot label="HIGHEST" value={money0(maxSer)} />
          <Foot label="VS AVERAGE" value={`${vsAvg >= 0 ? '+' : ''}${vsAvg}%`} color={deltaColor} />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        <Panel>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -1.2 }}>
            {money0(Math.max(0, state.income - spent))}
          </div>
          <Label color={MNY} style={{ letterSpacing: 1.2, marginTop: 5 }}>
            SAVED THIS MONTH
          </Label>
        </Panel>
        <Panel>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -1.2 }}>
            {Math.round((Math.max(0, state.income - spent) / (state.income || 1)) * 100)}%
          </div>
          <Label color={dim(0.45)} style={{ letterSpacing: 1.2, marginTop: 5 }}>
            OF INCOME
          </Label>
        </Panel>
      </div>

      <div style={{ marginTop: 26, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Label>WHERE IT WENT</Label>
        <Label color={dim(0.4)}>TAP TO FILTER</Label>
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {byCat.map((c) => (
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
    </Screen>
  );
}

function Foot({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1.1, color: dim(0.4) }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 14, marginTop: 4, color: color || undefined }}>{value}</div>
    </div>
  );
}
