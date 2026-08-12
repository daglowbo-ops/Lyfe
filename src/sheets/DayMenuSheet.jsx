import Sheet from '../components/Sheet.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { REST_DAY } from '../data/templates.js';
import { DOW_LONG, MON_SHORT, dowIndex, parseKey } from '../lib/date.js';
import { INK, dim } from '../lib/theme.js';

/** Assigns a session to one planned day. Opened from either plan view. */
export default function DayMenuSheet() {
  const { state, dispatch, patch } = useApp();
  const k = state.dayMenu;
  const d = parseKey(k);
  const current = state.plan[k] || REST_DAY;
  const options = state.templates.map((t) => t.name).concat([REST_DAY]);

  return (
    <Sheet
      title={`Workout for ${DOW_LONG[dowIndex(d)]} ${d.getDate()} ${MON_SHORT[d.getMonth()]}`}
      onClose={() => patch({ dayMenu: null })}
    >
      <div className="scroll" style={{ flex: 1, marginTop: 14 }}>
        {options.map((name) => {
          const on = name === current;
          return (
            <button
              key={name}
              className="rowlink"
              onClick={() => dispatch({ type: 'setPlanDay', key: k, name })}
              aria-pressed={on}
              style={{
                width: '100%',
                height: 56,
                padding: '0 16px',
                marginBottom: 6,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 16,
                fontWeight: 500,
                color: on ? INK : dim(0.7),
                background: on ? dim(0.1) : 'transparent',
              }}
            >
              <span>{name === REST_DAY ? 'Rest' : name}</span>
              <span style={{ fontSize: 14 }}>{on ? '✓' : ''}</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
