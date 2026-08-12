import Screen from '../../components/Screen.jsx';
import { GhostButton, Label, Mono, Stepper } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { workoutTotals } from '../../store/selectors.js';
import { REST_SECONDS } from '../../store/reducer.js';
import { INK, MONO, ON_TRN, TRN, dim } from '../../lib/theme.js';
import { displayWeight, weightUnit } from '../../lib/format.js';

export default function TrainScreen() {
  const { state, dispatch, patch } = useApp();

  // A session edit can shrink the list under a stale index.
  const exIdx = Math.min(state.exIdx, state.workout.length - 1);
  const ex = state.workout[exIdx] || { name: '', last: '—', sets: [] };
  const { all, done, volume } = workoutTotals(state.workout);
  const isLast = exIdx >= state.workout.length - 1;
  const complete = all > 0 && done === all;
  const useKg = state.toggles.kg;
  const unit = weightUnit(useKg);
  const bumpWeight = useKg ? 2.5 : 2.26796185; // 5 lb stored internally as kg.

  return (
    <>
      <Screen>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button
            className="outline-trn"
            onClick={() => patch({ pickSheet: true })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              padding: '0 14px',
              borderRadius: 13,
              border: `1px solid ${dim(0.14)}`,
              transition: 'border-color .2s',
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1.4, color: TRN }}>
              {state.curName.toUpperCase()}
            </span>
            <span style={{ fontSize: 12, color: dim(0.62) }}>▾</span>
          </button>
          <GhostButton height={44} style={{ padding: '0 16px', fontSize: 14 }} onClick={() => patch({ editSheet: true })}>
            Edit workout
          </GhostButton>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: -1, lineHeight: 1.15, paddingRight: 12 }}>
            {ex.name}
          </h1>
          <Mono color={dim(0.6)} style={{ whiteSpace: 'nowrap' }}>
            {exIdx + 1} / {state.workout.length}
          </Mono>
        </div>

        <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
          {state.workout.map((e, i) => (
            <button
              key={i}
              onClick={() => patch({ exIdx: i })}
              aria-label={`Ir a ${e.name}`}
              style={{ flex: 1, padding: '14px 0' }}
            >
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  transition: 'background .3s',
                  background:
                    i === exIdx ? INK : e.sets.every((s) => s.d) ? TRN : dim(0.15),
                }}
              />
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <StatBox label="LAST TIME" value={formatLast(ex.last, useKg)} />
          <StatBox label="TARGET" value={`${ex.sets.length} × ${ex.sets[0]?.r ?? 0}`} />
        </div>

        <div
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: '26px 1fr 1fr 44px',
            gap: 10,
            alignItems: 'center',
            paddingBottom: 8,
          }}
        >
          {['#', `WEIGHT · ${unit.toUpperCase()}`, 'REPS'].map((h) => (
            <span key={h} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1.1, color: dim(0.6) }}>
              {h}
            </span>
          ))}
          <span />
        </div>

        {ex.sets.map((s, j) => (
          <div
            key={j}
            style={{
              display: 'grid',
              gridTemplateColumns: '26px 1fr 1fr 44px',
              gap: 10,
              alignItems: 'center',
              padding: '7px 0',
              opacity: s.d ? 0.55 : 1,
              transition: 'opacity .3s',
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 13, color: dim(0.62) }}>{j + 1}</span>
            <Stepper
              value={displayWeight(s.w, useKg, useKg ? 1 : 0)}
              downLabel="Less weight"
              upLabel="More weight"
              onDown={() => !state.sessionFinished && dispatch({ type: 'bumpSet', ei: exIdx, si: j, field: 'w', delta: -bumpWeight })}
              onUp={() => !state.sessionFinished && dispatch({ type: 'bumpSet', ei: exIdx, si: j, field: 'w', delta: bumpWeight })}
            />
            <Stepper
              value={s.r}
              downLabel="Fewer reps"
              upLabel="More reps"
              onDown={() => !state.sessionFinished && dispatch({ type: 'bumpSet', ei: exIdx, si: j, field: 'r', delta: -1 })}
              onUp={() => !state.sessionFinished && dispatch({ type: 'bumpSet', ei: exIdx, si: j, field: 'r', delta: 1 })}
            />
            <button
              onClick={() => {
                if (!s.d && state.toggles.haptics && navigator.vibrate) navigator.vibrate(28);
                dispatch({ type: 'toggleSet', ei: exIdx, si: j });
              }}
              aria-pressed={s.d}
              aria-label={`Set ${j + 1} complete`}
              style={{
                width: 44,
                height: 46,
                borderRadius: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background .25s, border-color .25s',
                border: `1px solid ${s.d ? TRN : dim(0.14)}`,
                background: s.d ? TRN : 'transparent',
                color: s.d ? ON_TRN : INK,
                fontSize: 16,
              }}
            >
              {s.d ? '✓' : ''}
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <GhostButton
            height={52}
            style={{ width: 56, fontSize: 17 }}
            onClick={() => patch({ exIdx: Math.max(0, exIdx - 1) })}
          >
            ←
          </GhostButton>
          <button
            className="rowlink"
            onClick={() =>
              isLast
                ? state.sessionFinished
                  ? dispatch({ type: 'screen', screen: 'today' })
                  : complete
                    ? dispatch({ type: 'finishWorkout' })
                    : undefined
                : patch({ exIdx: exIdx + 1 })
            }
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              background: dim(0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            {isLast
              ? state.sessionFinished
                ? 'Workout saved · back to Today'
                : complete
                  ? 'Save completed workout'
                  : `${all - done} sets left`
              : `Next: ${state.workout[exIdx + 1].name}`}
          </button>
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: MONO,
            fontSize: 12,
            color: dim(0.6),
          }}
        >
          <span>VOLUME {Math.round(displayWeight(volume, useKg, 0))} {unit}</span>
          <span>
            {done}/{all} SETS
          </span>
        </div>
      </Screen>

      {state.resting && <RestBar left={state.restLeft} onSkip={() => dispatch({ type: 'skipRest' })} />}
    </>
  );
}

function formatLast(value, useKg) {
  if (!value) return '—';
  const match = String(value).match(/([0-9]+(?:\.[0-9]+)?)\s*kg\s*×\s*([0-9]+)/i);
  if (!match) return value;
  const unit = weightUnit(useKg);
  return `${displayWeight(Number(match[1]), useKg, useKg ? 1 : 0)} ${unit} × ${match[2]}`;
}

function StatBox({ label, value }) {
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${dim(0.06)}`,
        borderRadius: 16,
        padding: '14px 16px',
        background: '#111110',
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1.3, color: dim(0.6) }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 500, marginTop: 6, letterSpacing: -0.3 }}>{value}</div>
    </div>
  );
}

/** Floats above the tab bar while a rest is running. */
function RestBar({ left, onSkip }) {
  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, '0');
  return (
    <div
      className="pop-in"
      role="timer"
      aria-live="off"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 98px)',
        borderRadius: 18,
        background: '#1B1A17',
        border: `1px solid ${dim(0.14)}`,
        padding: '14px 16px 12px',
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Label color={TRN}>REST</Label>
        <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 500 }}>
          {m}:{s}
        </span>
        <button
          className="muted-link"
          onClick={onSkip}
          style={{ height: 44, padding: '0 6px', marginRight: -6, fontSize: 14, color: dim(0.6) }}
        >
          Skip
        </button>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: dim(0.12), marginTop: 10, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            background: TRN,
            width: '100%',
            transform: `scaleX(${left / REST_SECONDS})`,
            transformOrigin: 'left center',
            transition: 'transform 1s linear',
          }}
        />
      </div>
    </div>
  );
}
