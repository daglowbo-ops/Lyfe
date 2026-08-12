import Sheet from '../components/Sheet.jsx';
import { CheckRow, Chip, Label, PrimaryButton } from '../components/Primitives.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { CATEGORIES, categoryLabel } from '../data/money.js';
import { money, toFloat } from '../lib/format.js';
import { MNY, MONO, ON_MNY, dim, input } from '../lib/theme.js';

const STEP = 10;

export default function AddExpenseSheet() {
  const { state, dispatch } = useApp();
  const d = state.draftTxn;
  const set = (patch) => dispatch({ type: 'draftTxn', patch });
  const amt = toFloat(d.amt);

  const nudge = (delta) =>
    set({ amt: String(Math.max(0, Math.round(((parseFloat(d.amt) || 0) + delta) * 100) / 100)) });

  return (
    <Sheet title="New expense" onClose={() => dispatch({ type: 'closeAddTxn' })} maxHeight="82%">
      <div className="scroll" style={{ flex: 1, paddingTop: 14 }}>
        <Label style={{ marginBottom: 8 }}>AMOUNT</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BigStep label={`Subtract ${STEP}`} onClick={() => nudge(-STEP)}>
            −
          </BigStep>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            aria-label="Amount in bolivianos"
            value={d.amt}
            onChange={(e) => set({ amt: e.target.value })}
            style={{
              ...input,
              flex: 1,
              minWidth: 0,
              height: 56,
              borderRadius: 14,
              padding: 0,
              textAlign: 'center',
              fontFamily: MONO,
              fontSize: 26,
              fontWeight: 500,
            }}
          />
          <BigStep label={`Add ${STEP}`} onClick={() => nudge(STEP)}>
            +
          </BigStep>
        </div>

        <Label style={{ margin: '18px 0 8px' }}>CATEGORY</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={categoryLabel(c)} height={44} selected={d.cat === c} onClick={() => set({ cat: c })} />
          ))}
        </div>

        <Label style={{ margin: '18px 0 8px' }}>DETAIL · OPTIONAL · ESPAÑOL OK</Label>
        <input
          type="text"
          maxLength={120}
          placeholder="e.g. Almuerzo with Ana"
          value={d.label}
          onChange={(e) => set({ label: e.target.value })}
          style={{ ...input, width: '100%', boxSizing: 'border-box', height: 48 }}
        />

        <CheckRow checked={d.fav} accent={MNY} onClick={() => set({ fav: !d.fav })}>
          Save as a one-tap shortcut
        </CheckRow>

        <PrimaryButton
          background={MNY}
          color={ON_MNY}
          height={54}
          disabled={!amt}
          style={{ marginTop: 14, borderRadius: 15 }}
          onClick={() =>
            dispatch({ type: 'addTxn', amt: d.amt, label: d.label, cat: d.cat, fav: d.fav && d.label.trim() })
          }
        >
          Add {amt > 0 ? money(amt) : ''}
        </PrimaryButton>
      </div>
    </Sheet>
  );
}

function BigStep({ children, onClick, label }) {
  return (
    <button
      className="stepper"
      onClick={onClick}
      aria-label={label}
      style={{
        width: 52,
        height: 56,
        borderRadius: 14,
        border: `1px solid ${dim(0.12)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        color: dim(0.55),
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
