import Sheet from '../components/Sheet.jsx';
import { AddButton, GhostButton, Label, PrimaryButton, Stepper } from '../components/Primitives.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { ON_TRN, TRN, dim, input } from '../lib/theme.js';

export default function SessionEditSheet() {
  const { state, dispatch, patch } = useApp();
  const close = () => patch({ editSheet: false });
  const known = state.templates.some((t) => t.name === state.curName);

  return (
    <Sheet title="Edit workout" onClose={close} height="86%">
      <input
        type="text"
        maxLength={80}
        aria-label="Workout name"
        value={state.curName}
        onChange={(e) => patch({ curName: e.target.value })}
        style={{ ...input, marginTop: 14, fontSize: 16, fontWeight: 500, flexShrink: 0 }}
      />

      <Label style={{ margin: '18px 0 6px' }}>EXERCISES · SETS × REPS</Label>

      <div className="scroll" style={{ flex: 1, margin: '0 -4px', padding: '0 4px' }}>
        {state.workout.map((e, i) => (
          <div
            key={i}
            style={{
              border: `1px solid ${dim(0.1)}`,
              borderRadius: 16,
              padding: 12,
              marginBottom: 8,
              background: '#0F0F0E',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                maxLength={100}
                aria-label={`Exercise ${i + 1} name`}
                value={e.name}
                onChange={(ev) => dispatch({ type: 'renameExercise', i, name: ev.target.value })}
                style={{ ...input, flex: 1, minWidth: 0, height: 44, borderRadius: 12, fontWeight: 500 }}
              />
              <button
                className="outline"
                onClick={() => dispatch({ type: 'removeExercise', i })}
                aria-label={`Remove ${e.name}`}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: `1px solid ${dim(0.1)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: dim(0.65),
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <Stepper
                  height={48}
                  labelPrefix="SETS"
                  value={e.sets.length}
                  downLabel="Fewer sets"
                  upLabel="More sets"
                  onDown={() => dispatch({ type: 'setsDelta', i, delta: -1 })}
                  onUp={() => dispatch({ type: 'setsDelta', i, delta: 1 })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Stepper
                  height={48}
                  labelPrefix="REPS"
                  value={e.sets[0]?.r ?? 0}
                  downLabel="Fewer reps"
                  upLabel="More reps"
                  onDown={() => dispatch({ type: 'repsDelta', i, delta: -1 })}
                  onUp={() => dispatch({ type: 'repsDelta', i, delta: 1 })}
                />
              </div>
            </div>
          </div>
        ))}

        <AddButton
          accent="trn"
          height={50}
          style={{ borderRadius: 14, background: 'transparent', marginBottom: 8 }}
          onClick={() => dispatch({ type: 'addExercise' })}
        >
          Add exercise
        </AddButton>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexShrink: 0 }}>
        <PrimaryButton
          background={TRN}
          color={ON_TRN}
          style={{ flex: 1, fontSize: 15 }}
          onClick={() => dispatch({ type: 'saveTemplate' })}
        >
          {known ? `Save ${state.curName}` : 'Save as new workout'}
        </PrimaryButton>
        {/* Closing without saving keeps the edits on today's session only. */}
        <GhostButton height={52} style={{ width: 120 }} onClick={close}>
          Today only
        </GhostButton>
      </div>
    </Sheet>
  );
}
