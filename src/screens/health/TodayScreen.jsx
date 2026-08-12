import Screen from '../../components/Screen.jsx';
import { Avatar, Card, Label, Meter, Mono, PrimaryButton, ScreenTitle } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { dayTotals, goalOn, onTarget, streak, workoutTotals } from '../../store/selectors.js';
import { DOWS, addDays, dowIndex, fullLabel, key, startOfToday } from '../../lib/date.js';
import { pct } from '../../lib/format.js';
import { DIM, MONO, NUT, ON_TRN, TRN, dim } from '../../lib/theme.js';

export default function TodayScreen() {
  const { state, dispatch } = useApp();
  const today = startOfToday();

  const totals = dayTotals(state.meals);
  const goal = state.goals;
  const { all, done } = workoutTotals(state.workout);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const k = key(d);
    const rec = i === 0 ? { kcal: totals.kcal, trained: done > 0 } : state.hist[k] || {};
    days.push({
      k,
      dow: DOWS[dowIndex(d)],
      ate: onTarget(rec.kcal, goalOn(state, k).kcal) ? NUT : DIM,
      trained: rec.trained ? TRN : DIM,
      isToday: i === 0,
    });
  }

  // The recent list reads from what is actually logged rather than a fixed
  // sample: the newest meals first, then yesterday's session if there was one.
  const recent = state.meals
    .slice(-3)
    .reverse()
    .map((m) => ({ id: m.id, name: m.name, sub: m.slot, val: String(m.kcal), col: NUT }));
  const yesterday = state.hist[key(addDays(today, -1))];
  if (yesterday?.trained) {
    recent.push({ id: 'yday', name: state.curName, sub: 'Yesterday · workout complete', val: 'Done', col: TRN });
  }

  const completed = state.sessionFinished || state.workoutHistory.some((item) => item.date === key(today));
  const cta = completed ? 'Workout complete' : done === 0 ? 'Start workout' : 'Continue workout';
  const initials = state.profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'ME';

  return (
    <Screen>
      <div style={{ marginBottom: 26 }}>
        <ScreenTitle
          eyebrow={fullLabel(today)}
          title="Today"
          right={<Avatar initials={initials} onClick={() => dispatch({ type: 'openProfile' })} />}
        />
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Label color={NUT}>CALORIES LEFT</Label>
          <Mono color={dim(0.6)}>
            {totals.kcal} / {goal.kcal}
          </Mono>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '6px 0 16px' }}>
          <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: -3.5, lineHeight: 1 }}>
            {Math.max(0, goal.kcal - totals.kcal)}
          </div>
          <div style={{ fontSize: 15, color: dim(0.6), paddingBottom: 9 }}>kcal</div>
        </div>
        <Meter value={pct(totals.kcal, goal.kcal)} color={NUT} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 18 }}>
          <MacroCell label="PROTEIN" text={`${totals.p}/${goal.p}`} bar={pct(totals.p, goal.p)} />
          <MacroCell label="CARBS" text={`${totals.c} g`} />
          <MacroCell label="FAT" text={`${totals.f} g`} />
        </div>
      </Card>

      <Card style={{ marginTop: 14, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Label color={TRN}>TODAY'S WORKOUT</Label>
          <Mono color={dim(0.6)}>
            {done}/{all} SETS
          </Mono>
        </div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.9, margin: '8px 0 3px' }}>
          {state.curName}
        </div>
        <div style={{ fontSize: 14, color: dim(0.62) }}>
          {state.workout.length} exercises ·{' '}
          {state.workout.map((e) => e.name).slice(0, 2).join(', ')}…
        </div>
        <PrimaryButton
          background={TRN}
          color={ON_TRN}
          style={{ marginTop: 18 }}
          onClick={() => dispatch({ type: 'screen', screen: 'train' })}
        >
          {cta}
        </PrimaryButton>
      </Card>

      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label>LAST 7 DAYS</Label>
        <Label>{streak(state, today)} DAY STREAK</Label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginTop: 12 }}>
        {days.map((d) => (
          <div
            key={d.k}
            style={{
              border: `1px solid ${dim(0.09)}`,
              borderRadius: 12,
              padding: '10px 0 9px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 7,
              background: d.isToday ? dim(0.06) : 'transparent',
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 0.5, color: dim(0.58) }}>
              {d.dow}
            </span>
            <Dot color={d.ate} />
            <Dot color={d.trained} />
          </div>
        ))}
      </div>

      <Label style={{ marginTop: 26 }}>RECENT ACTIVITY</Label>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
        {recent.map((r) => (
          <div
            key={r.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: `1px solid ${dim(0.07)}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: r.col }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: dim(0.6), marginTop: 2 }}>{r.sub}</div>
              </div>
            </div>
            <Mono size={13}>{r.val}</Mono>
          </div>
        ))}
        {recent.length === 0 && (
          <div style={{ fontSize: 14, color: dim(0.6), paddingTop: 6 }}>Nothing logged yet.</div>
        )}
      </div>
    </Screen>
  );
}

function MacroCell({ label, text, bar }) {
  return (
    <div>
      <div style={{ marginBottom: 7, minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1.1, color: dim(0.6), whiteSpace: 'nowrap' }}>
          {label}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: dim(0.8), marginTop: 3, whiteSpace: 'nowrap' }}>
          {text}
        </div>
      </div>
      {bar && <Meter value={bar} color={dim(0.55)} height={3} />}
    </div>
  );
}

const Dot = ({ color }) => (
  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
);
