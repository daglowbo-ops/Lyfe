import Screen from '../../components/Screen.jsx';
import { EmptyNote, GhostButton, Label, Meter, Mono, Panel } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { goalOn, onTarget } from '../../store/selectors.js';
import { addDays, key, startOfToday } from '../../lib/date.js';
import { MONO, NUT, TRN, dim } from '../../lib/theme.js';
import { displayWeight, weightUnit } from '../../lib/format.js';

const CHART_W = 300;
const CHART_H = 108;
const PLOT_TOP = 10;
const PLOT_BOTTOM = 86;

export default function StatsScreen() {
  const { state, dispatch } = useApp();
  const today = startOfToday();

  const useKg = state.toggles.kg;
  const unit = weightUnit(useKg);
  const weightEntries = state.weights
    .filter((entry) => entry.date >= key(addDays(today, -83)))
    .sort((a, b) => a.date.localeCompare(b.date));
  const weights = weightEntries.map((entry) => displayWeight(entry.value, useKg));
  const min = weights.length ? Math.min(...weights) : 0;
  const max = weights.length ? Math.max(...weights) : 0;
  const weightPoints = weights
    .map((v, i) => {
      const x = weights.length === 1 ? CHART_W / 2 : (i / (weights.length - 1)) * CHART_W;
      const y = PLOT_BOTTOM - ((v - min) / (max - min || 1)) * (PLOT_BOTTOM - PLOT_TOP);
      return { x, y, value: v };
    });
  const points = weightPoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const areaPoints = weights.length > 1 ? `0,${PLOT_BOTTOM} ${points} ${CHART_W},${PLOT_BOTTOM}` : '';
  const delta = weights.length > 1 ? weights.at(-1) - weights[0] : 0;

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
  const hasWorkouts = volume.some((sessions) => sessions > 0);
  const averageVolume = volume.reduce((sum, sessions) => sum + sessions, 0) / volume.length;

  // Adherence over the last 30 closed days.
  const last30 = Array.from({ length: 30 }, (_, i) => key(addDays(today, -(i + 1))))
    .map((k) => ({ k, rec: state.hist[k] }))
    .filter((x) => x.rec);
  const kcalHit = last30.filter((x) => onTarget(x.rec.kcal, goalOn(state, x.k).kcal)).length;
  const trainHit = last30.filter((x) => x.rec.trained).length;
  const personalBests = bestSets(state);

  return (
    <Screen>
      <Label>LAST 12 WEEKS</Label>
      <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1, margin: '5px 0 0' }}>Progress</h1>

      <Panel style={{ marginTop: 22 }}>
        <Label>BODY WEIGHT</Label>
        {weights.length ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 38, fontWeight: 600, letterSpacing: -2, lineHeight: 1 }}>
                  {weights.at(-1)}
                </span>
                <span style={{ fontSize: 13, color: dim(0.6) }}>{unit}</span>
              </div>
              <Mono size={12} color={NUT}>
                {weights.length === 1 ? 'baseline' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${unit}`}
              </Mono>
            </div>
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={weights.length === 1
                ? `Body weight baseline: ${weights[0]} ${unit}`
                : `Body weight, from ${weights[0]} to ${weights.at(-1)} ${unit} over 12 weeks`}
              style={{ width: '100%', height: CHART_H, marginTop: 14, overflow: 'visible' }}
            >
              {[PLOT_TOP, (PLOT_TOP + PLOT_BOTTOM) / 2, PLOT_BOTTOM].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2={CHART_W}
                  y1={y}
                  y2={y}
                  stroke="rgba(233,229,220,0.09)"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {weights.length > 1 ? (
                <>
                  <polygon points={areaPoints} fill={NUT} opacity="0.06" />
                  <polyline
                    points={points}
                    fill="none"
                    stroke={NUT}
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={weightPoints.at(-1).x} cy={weightPoints.at(-1).y} r="3.5" fill={NUT} />
                  <circle cx={weightPoints.at(-1).x} cy={weightPoints.at(-1).y} r="7" fill="none" stroke={NUT} opacity="0.25" />
                </>
              ) : (
                <circle cx={weightPoints[0].x} cy={weightPoints[0].y} r="3" fill={NUT} />
              )}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 12, color: dim(0.58), marginTop: 6 }}>
              <span>{weightEntries[0].date}</span>
              <span>{weightEntries.at(-1).date}</span>
            </div>
          </>
        ) : (
          <EmptyNote
            title="No weight history yet"
            style={{ marginTop: 14, padding: '22px 18px' }}
            action={(
              <GhostButton className="outline-nut" style={{ width: '100%', borderColor: NUT, color: NUT }} onClick={() => dispatch({ type: 'openProfile' })}>
                Log weight in Profile
              </GhostButton>
            )}
          >
            Add your first entry to create a real trend line.
          </EmptyNote>
        )}
      </Panel>

      <Panel style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <Label>WORKOUTS PER WEEK</Label>
            {hasWorkouts && <div style={{ marginTop: 7, fontSize: 23, fontWeight: 600, letterSpacing: -0.8 }}>{volume.at(-1)} this week</div>}
          </div>
          {hasWorkouts && <Mono color={dim(0.6)}>{averageVolume.toFixed(1)} avg</Mono>}
        </div>
        {hasWorkouts ? (
          <>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 6, height: 92, marginTop: 18, borderBottom: `1px solid ${dim(0.12)}` }}>
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
                      height: v ? `${Math.max(4, Math.round((v / maxVol) * 100))}%` : 2,
                      background: i === volume.length - 1 ? TRN : dim(0.2),
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 12, color: dim(0.58), marginTop: 8 }}>
              <span>W1</span>
              <span>W12</span>
            </div>
          </>
        ) : (
          <EmptyNote
            title="No completed workouts yet"
            style={{ marginTop: 14, padding: '22px 18px' }}
            action={(
              <GhostButton className="outline-trn" style={{ width: '100%', borderColor: TRN, color: TRN }} onClick={() => dispatch({ type: 'screen', screen: 'train' })}>
                Start a workout
              </GhostButton>
            )}
          >
            Finish a workout to begin your weekly history.
          </EmptyNote>
        )}
      </Panel>

      <Panel style={{ marginTop: 14 }}>
        <Label>30 DAY CONSISTENCY</Label>
        <ConsistencyRow
          label="Calories on target"
          value={last30.length ? `${kcalHit}/${last30.length}` : '—'}
          percent={last30.length ? (kcalHit / last30.length) * 100 : 0}
          color={NUT}
        />
        <ConsistencyRow
          label="Workout days"
          value={last30.length ? `${trainHit}/${last30.length}` : '—'}
          percent={last30.length ? (trainHit / last30.length) * 100 : 0}
          color={TRN}
          last
        />
      </Panel>

      <Label style={{ marginTop: 26 }}>BEST SET BY EXERCISE</Label>
      {personalBests.map((p) => (
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
            <div style={{ fontSize: 12, color: dim(0.6), marginTop: 2 }}>{p.note}</div>
          </div>
          <Mono size={14} color={TRN}>
            {p.value}
          </Mono>
        </div>
      ))}
      {personalBests.length === 0 && (
        <EmptyNote style={{ marginTop: 12, padding: '22px 18px' }}>
          Personal bests appear after you complete and save a workout.
        </EmptyNote>
      )}
    </Screen>
  );
}

function ConsistencyRow({ label, value, percent, color, last }) {
  return (
    <div style={{ padding: '15px 0', borderBottom: last ? 'none' : `1px solid ${dim(0.08)}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 9 }}>
        <span style={{ fontSize: 14.5, fontWeight: 500 }}>{label}</span>
        <Mono size={13} color={color}>{value}</Mono>
      </div>
      <Meter value={`${percent}%`} color={color} height={4} track={dim(0.09)} label={`${label}: ${Math.round(percent)}%`} />
    </div>
  );
}

/**
 * The heaviest set from completed workout archives. Planned template weights
 * are intentionally excluded because they are not personal records.
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
  for (const session of state.workoutHistory) consider(session.exercises, session.date);

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
