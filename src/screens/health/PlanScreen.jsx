import Screen from '../../components/Screen.jsx';
import { Label, Mono, Panel, SegmentedControl } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { dayTotals, goalOn, onTarget, workoutTotals } from '../../store/selectors.js';
import { REST_DAY } from '../../data/templates.js';
import {
  DOWS, DOW_LONG, MON_SHORT, addDays, addMonths, dowIndex,
  key, monthGrid, monthLabel, parseKey, startOfToday,
} from '../../lib/date.js';
import { DIM, INK, MONO, NUT, TRN, dim } from '../../lib/theme.js';

export default function PlanScreen() {
  const { state, patch } = useApp();
  return (
    <Screen>
      <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1, margin: 0 }}>Plan</h1>
      <Label style={{ marginTop: 6 }}>{monthLabel(startOfToday())}</Label>
      <SegmentedControl
        style={{ marginTop: 18 }}
        value={state.planMode}
        onChange={(v) => patch({ planMode: v })}
        options={[
          { value: 'month', label: 'Month' },
          { value: 'week', label: 'Week' },
        ]}
      />
      {state.planMode === 'month' ? <MonthView /> : <WeekView />}
    </Screen>
  );
}

function MonthView() {
  const { state, patch } = useApp();
  const today = startOfToday();
  const todayKey = key(today);
  const monthStart = addMonths(today, state.calOff);
  const totals = dayTotals(state.meals);
  const workoutByDate = new Map((state.workoutHistory || []).map((session) => [session.date, session]));
  const trainedToday = workoutTotals(state.workout).done > 0 || workoutByDate.has(todayKey);

  const recordFor = (k) => {
    if (k === todayKey) return { kcal: totals.kcal, p: totals.p, trained: trainedToday };
    const record = state.hist[k] || {};
    return { ...record, trained: workoutByDate.has(k) || Boolean(record.trained) };
  };

  const selDate = parseKey(state.sel);
  const selRec = recordFor(state.sel);
  const selWorkout = workoutByDate.get(state.sel);
  const selGoal = goalOn(state, state.sel);
  const isPast = state.sel < todayKey;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
        <ArrowButton label="Previous month" onClick={() => patch({ calOff: state.calOff - 1 })}>
          ‹
        </ArrowButton>
        <Mono size={12} color={dim(0.7)} style={{ letterSpacing: 1.6 }}>
          {monthLabel(monthStart)}
        </Mono>
        <ArrowButton
          label="Next month"
          disabled={state.calOff >= 0}
          onClick={() => patch({ calOff: Math.min(0, state.calOff + 1) })}
        >
          ›
        </ArrowButton>
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
          const k = key(d);
          const outside = d.getMonth() !== monthStart.getMonth();
          const rec = recordFor(k);
          const future = k > todayKey;
          const planned = state.plan[k] && state.plan[k] !== REST_DAY;
          return (
            <button
              key={k}
              onClick={() => patch({ sel: k, dayMenu: null })}
              aria-current={k === todayKey ? 'date' : undefined}
              style={{
                aspectRatio: '1',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'background .2s',
                opacity: outside ? 0.28 : 1,
                background: state.sel === k ? dim(0.13) : 'transparent',
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 12, color: k === todayKey ? NUT : dim(0.85) }}>
                {d.getDate()}
              </span>
              <span style={{ display: 'flex', gap: 3, height: 5 }}>
                <Dot color={!future && onTarget(rec.kcal, goalOn(state, k).kcal) ? NUT : DIM} />
                <Dot
                  color={
                    rec.trained ? TRN : future && planned ? 'oklch(0.84 0.15 55 / 0.35)' : DIM
                  }
                />
              </span>
            </button>
          );
        })}
      </div>

      <Panel style={{ marginTop: 20 }}>
        <Label>
          {DOW_LONG[dowIndex(selDate)]} {selDate.getDate()} {MON_SHORT[selDate.getMonth()]}
        </Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
          <MiniStat
            label="CALORIES"
            value={selRec.kcal || '—'}
            unit={`/ ${selGoal.kcal}`}
            note="eaten / target"
          />
          <MiniStat
            label="PROTEIN"
            value={selRec.p || '—'}
            unit={`/ ${selGoal.p} g`}
            note="eaten / target"
          />
        </div>

        {isPast ? (
          <PastWorkout session={selWorkout} hasLegacyRecord={selRec.trained} />
        ) : (
          <div style={{ marginTop: 16 }}>
            <Label color={TRN} size={10} style={{ letterSpacing: 1.2, marginBottom: 8 }}>
              WORKOUT
            </Label>
            <button
              className="outline-trn"
              onClick={() => patch({ dayMenu: state.dayMenu === state.sel ? null : state.sel })}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 14,
                border: `1px solid ${dim(0.14)}`,
                background: dim(0.05),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                transition: 'border-color .2s',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.3 }}>
                {displayPlan(state.plan[state.sel] || REST_DAY)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: dim(0.62),
                  transition: 'transform .22s',
                  transform: state.dayMenu === state.sel ? 'rotate(180deg)' : 'none',
                }}
              >
                ▼
              </span>
            </button>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 18,
            marginTop: 18,
            paddingTop: 14,
            borderTop: `1px solid ${dim(0.08)}`,
          }}
        >
          <Legend color={NUT}>calories on target</Legend>
          <Legend color={TRN}>trained</Legend>
        </div>
      </Panel>
    </div>
  );
}

function WeekView() {
  const { state, patch } = useApp();
  const today = startOfToday();

  return (
    <div className="fade-in" style={{ marginTop: 20 }}>
      <Label style={{ marginBottom: 12 }}>CHOOSE EACH DAY'S WORKOUT</Label>
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(today, i);
        const k = key(d);
        const name = state.plan[k] || REST_DAY;
        const rest = name === REST_DAY;
        return (
          <button
            key={k}
            className="outline"
            onClick={() => patch({ dayMenu: state.dayMenu === k ? null : k })}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '15px 16px',
              marginBottom: 8,
              borderRadius: 16,
              border: `1px solid ${dim(0.09)}`,
              background: i === 0 ? dim(0.05) : 'transparent',
              transition: 'border-color .2s, background .2s',
            }}
          >
            <div style={{ width: 38 }}>
              <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1, color: dim(0.6) }}>
                {DOW_LONG[dowIndex(d)]}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 15, marginTop: 2 }}>{d.getDate()}</div>
            </div>
            <div style={{ width: 3, height: 34, borderRadius: 2, background: rest ? DIM : TRN }} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    letterSpacing: -0.3,
                    color: rest ? dim(0.5) : INK,
                  }}
                >
                  {displayPlan(name)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: dim(0.62),
                    transition: 'transform .22s',
                    transform: state.dayMenu === k ? 'rotate(180deg)' : 'none',
                  }}
                >
                  ▼
                </span>
              </div>
              <div style={{ fontSize: 12, color: dim(0.6), marginTop: 2 }}>
                {rest ? 'Rest · 30 min walk' : 'Strength · 55 min'}
              </div>
            </div>
            <Mono size={12} color={dim(0.6)}>
              {goalOn(state, k).kcal}
            </Mono>
          </button>
        );
      })}
    </div>
  );
}

function ArrowButton({ children, onClick, disabled, label }) {
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

function MiniStat({ label, value, unit, note }) {
  return (
    <div style={{ borderRadius: 14, background: dim(0.04), padding: 14 }}>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1.1, color: NUT }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 7 }}>
        <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: -1 }}>{value}</span>
        <Mono size={12} color={dim(0.6)}>
          {unit}
        </Mono>
      </div>
      <div style={{ fontSize: 12, color: dim(0.58), marginTop: 3 }}>{note}</div>
    </div>
  );
}

function PastWorkout({ session, hasLegacyRecord }) {
  if (!session) {
    return (
      <section
        aria-label="Past workout"
        style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${dim(0.08)}` }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>
            {hasLegacyRecord ? 'Workout details unavailable' : 'No completed workout'}
          </div>
          <Label style={{ flexShrink: 0, letterSpacing: 1 }}>READ ONLY</Label>
        </div>
        <div style={{ marginTop: 5, color: dim(0.58), fontSize: 12.5, lineHeight: 1.4 }}>
          {hasLegacyRecord
            ? 'This earlier day was marked as trained before detailed workout archives were available.'
            : 'There is no saved workout completion for this day.'}
        </div>
      </section>
    );
  }

  const exercises = Array.isArray(session.exercises) ? session.exercises : [];
  const totalSets = exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0);

  return (
    <section
      aria-label={`Completed workout: ${session.name || 'Workout'}`}
      style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${dim(0.08)}` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: -0.45, lineHeight: 1.2 }}>
            {session.name || 'Completed workout'}
          </h2>
          <div style={{ marginTop: 4, fontSize: 12.5, color: dim(0.6) }}>
            {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'} · {totalSets} {totalSets === 1 ? 'set' : 'sets'}
          </div>
        </div>
        <Label color={TRN} style={{ flexShrink: 0, letterSpacing: 1 }}>COMPLETED</Label>
      </div>

      <div style={{ marginTop: 13 }}>
        {exercises.map((exercise, index) => (
          <div
            key={`${exercise.name || 'exercise'}-${index}`}
            style={{
              minHeight: 44,
              padding: '10px 0',
              borderTop: `1px solid ${dim(0.07)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ minWidth: 0, overflowWrap: 'anywhere', fontSize: 14.5, fontWeight: 500, lineHeight: 1.3 }}>
              {exercise.name || `Exercise ${index + 1}`}
            </span>
            <Mono size={12} color={dim(0.62)} style={{ flexShrink: 0, textAlign: 'right' }}>
              {setSummary(exercise.sets)}
            </Mono>
          </div>
        ))}
      </div>

      <div style={{ paddingTop: 10, borderTop: `1px solid ${dim(0.07)}`, fontSize: 12, color: dim(0.56), lineHeight: 1.4 }}>
        Read-only completion record · later plan changes do not alter it
      </div>
    </section>
  );
}

function setSummary(rawSets) {
  const sets = Array.isArray(rawSets) ? rawSets : [];
  if (!sets.length) return 'No sets';
  const reps = sets.map((set) => Number(set.r) || 0);
  const sameReps = reps.every((rep) => rep === reps[0]);
  if (sameReps) return `${sets.length} × ${reps[0]} reps`;
  return `${sets.length} sets · ${Math.min(...reps)}–${Math.max(...reps)} reps`;
}

const Dot = ({ color }) => (
  <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
);

const Legend = ({ color, children }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: dim(0.6) }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
    {children}
  </span>
);

const displayPlan = (name) => (name === REST_DAY ? 'Rest' : name);
