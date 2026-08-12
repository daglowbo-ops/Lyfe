import Screen from '../../components/Screen.jsx';
import { Label, Mono, Panel } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { goalOn, onTarget } from '../../store/selectors.js';
import { addDays, key, startOfToday } from '../../lib/date.js';
import { MONO, NUT, TRN, dim } from '../../lib/theme.js';
import { displayWeight, weightUnit } from '../../lib/format.js';

const CHART_W = 300;
const CHART_H = 84;

export default function StatsScreen() {
  const { state } = useApp();
  const today = startOfToday();

  const useKg = state.toggles.kg;
  const unit = weightUnit(useKg);
  const weights = state.weights.map((entry) => displayWeight(entry.value, useKg));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const points = weights
    .map((v, i) => {
      const x = (i / (weights.length - 1)) * CHART_W;
      const y = 76 - ((v - min) / (max - min || 1)) * 68;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const delta = weights[weights.length - 1] - weights[0];

  // Weekly session count from detailed archives, with legacy day summaries as fallback.
  const volume = [];
  for (let w = 11; w >= 0; w--) {
    let sessions = 0;
    for (let d = 0; d < 7; d++) {
      const k = key(addDays(today, -(w * 7 + d)));
      if (state.workoutHistory.some((item) => item.date === k) || state.hist[k]?.trained) sessions++;
    }
    volume.push(sessions);
  }
  const maxVol = Math.max(...volume, 1);

  // Adherence over the last 30 closed days.
  const last30 = Array.from({ length: 30 }, (_, i) => key(addDays(today, -(i + 1))))
    .map((k) => ({ k, rec: state.hist[k] }))
    .filter((x) => x.rec);
  const kcalHit = last30.filter((x) => onTarget(x.rec.kcal, goalOn(state, x.k).kcal)).length;
  const trainHit = last30.filter((x) => x.rec.trained).length;

  return (
    <Screen>
      <Label>LAST 12 WEEKS</Label>
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1, marginTop: 5 }}>Progress</div>

      <Panel style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <Label>BODY WEIGHT</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 38, fontWeight: 600, letterSpacing: -2, lineHeight: 1 }}>
                {weights[weights.length - 1]}
              </span>
              <span style={{ fontSize: 13, color: dim(0.4) }}>{unit}</span>
            </div>
          </div>
          <Mono size={12} color={NUT}>
            {delta > 0 ? '+' : ''}
            {delta.toFixed(1)} {unit}
          </Mono>
        </div>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Body weight, from ${weights[0]} to ${weights[weights.length - 1]} ${unit} over 12 weeks`}
          style={{ width: '100%', height: CHART_H, marginTop: 14, overflow: 'visible' }}
        >
          <polyline
            points={points}
            fill="none"
            stroke="rgba(233,229,220,0.75)"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: MONO,
            fontSize: 10,
            color: dim(0.32),
            marginTop: 6,
          }}
        >
          <span>12 WEEKS AGO</span>
          <span>TODAY</span>
        </div>
      </Panel>

      <Panel style={{ marginTop: 14 }}>
        <Label>WORKOUTS PER WEEK</Label>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 96, marginTop: 16 }}>
          {volume.map((v, i) => (
            <div
              key={i}
              title={`${v} workouts`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}
            >
              <div
                className="grow-in"
                style={{
                  borderRadius: '4px 4px 2px 2px',
                  height: `${Math.max(4, Math.round((v / maxVol) * 100))}%`,
                  background: i === volume.length - 1 ? TRN : dim(0.22),
                }}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: MONO,
            fontSize: 10,
            color: dim(0.32),
            marginTop: 8,
          }}
        >
          <span>S1</span>
          <span>S12</span>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        <Panel>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1.4 }}>{kcalHit}/30</div>
          <Label color={NUT} style={{ letterSpacing: 1.2, marginTop: 5 }}>
            DAYS ON TARGET
          </Label>
        </Panel>
        <Panel>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1.4 }}>{trainHit}/30</div>
          <Label color={TRN} style={{ letterSpacing: 1.2, marginTop: 5 }}>
            WORKOUTS DONE
          </Label>
        </Panel>
      </div>

      <Label style={{ marginTop: 26 }}>BEST SET BY EXERCISE</Label>
      {bestSets(state).map((p) => (
        <div
          key={p.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '15px 0',
            borderBottom: `1px solid ${dim(0.07)}`,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: dim(0.4), marginTop: 2 }}>{p.note}</div>
          </div>
          <Mono size={14} color={TRN}>
            {p.value}
          </Mono>
        </div>
      ))}
    </Screen>
  );
}

/**
 * The heaviest set from completed workout archives. Templates are only a
 * fallback for accounts migrated from versions that did not archive sessions.
 */
function bestSets(state) {
  const best = new Map();
  const consider = (exercises, note) => {
    for (const e of exercises) {
      for (const s of e.sets) {
        const cur = best.get(e.name);
        if (!cur || s.w > cur.w) best.set(e.name, { w: s.w, r: s.r, note });
      }
    }
  };
  if (state.workoutHistory.length) {
    for (const session of state.workoutHistory) consider(session.exercises, session.date);
  } else {
    for (const t of state.templates) consider(t.exercises, t.name);
  }

  const useKg = state.toggles.kg;
  const unit = weightUnit(useKg);

  return [...best.entries()]
    .sort((a, b) => b[1].w - a[1].w)
    .slice(0, 3)
    .map(([name, v]) => ({
      name,
      note: v.note,
      value: `${displayWeight(v.w, useKg, useKg ? 1 : 0)} ${unit} × ${v.r}`,
    }));
}
