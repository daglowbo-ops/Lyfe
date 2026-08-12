import Sheet from '../components/Sheet.jsx';
import { AddButton, Label } from '../components/Primitives.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { TRN, dim } from '../lib/theme.js';

export default function SessionPickSheet() {
  const { state, dispatch, patch } = useApp();
  const close = () => patch({ pickSheet: false });

  return (
    <Sheet title="Today's workout" onClose={close}>
      <Label style={{ margin: '18px 0 4px' }}>MY WORKOUTS</Label>
      <div className="scroll" style={{ flex: 1 }}>
        {state.templates.map((t, i) => {
          const current = t.name === state.curName;
          return (
            <div
              key={t.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '15px 14px',
                marginBottom: 8,
                borderRadius: 16,
                transition: 'border-color .2s',
                border: `1px solid ${current ? TRN : dim(0.1)}`,
                background: current ? dim(0.05) : 'transparent',
              }}
            >
              <div style={{ width: 3, height: 32, borderRadius: 2, background: current ? TRN : dim(0.18) }} />
              <button
                onClick={() => dispatch({ type: 'pickTemplate', i })}
                style={{ flex: 1, textAlign: 'left' }}
              >
                <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.3 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: dim(0.6), marginTop: 2 }}>
                  {t.exercises.length} exercises ·{' '}
                  {t.exercises.reduce((a, e) => a + e.sets.length, 0)} sets
                </div>
              </button>
              <button
                className="muted-link"
                onClick={() => dispatch({ type: 'removeTemplate', i })}
                aria-label={`Delete ${t.name}`}
                style={{ fontSize: 13.5, color: dim(0.65), padding: '14px 10px', margin: '-14px -4px -14px 0' }}
              >
                Delete
              </button>
            </div>
          );
        })}
        <AddButton
          accent="trn"
          height={52}
          style={{ marginTop: 4, borderRadius: 14, background: 'transparent' }}
          onClick={() => dispatch({ type: 'newTemplate' })}
        >
          Create new workout
        </AddButton>
      </div>
    </Sheet>
  );
}
