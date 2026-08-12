import Sheet from '../components/Sheet.jsx';
import { CheckRow, Label, Mono, PrimaryButton, SegmentedControl } from '../components/Primitives.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { CATALOG, foodMatchesQuery } from '../data/foods.js';
import { slotLabel } from '../data/foods.js';
import { macroLine, toInt } from '../lib/format.js';
import { MONO, NUT, ON_NUT, dim, input } from '../lib/theme.js';

const RECENT_COUNT = 8;

export default function FoodSheet() {
  const { state, dispatch, patch } = useApp();
  const close = () => dispatch({ type: 'closeFoodSheet' });

  return (
    <Sheet title={`Add to ${slotLabel(state.slot)}`} onClose={close}>
      <SegmentedControl
        style={{ marginTop: 14, borderRadius: 13, flexShrink: 0 }}
        value={state.foodMode}
        onChange={(v) => patch({ foodMode: v })}
        options={[
          { value: 'search', label: 'Search' },
          { value: 'quick', label: 'Quick entry' },
        ]}
      />
      {state.foodMode === 'search' ? <SearchMode /> : <QuickMode />}
    </Sheet>
  );
}

function SearchMode() {
  const { state, dispatch, patch } = useApp();
  const q = state.query.trim();
  const all = state.customFoods.concat(CATALOG);
  const results = q ? all.filter((food) => foodMatchesQuery(food, q)) : all.slice(0, RECENT_COUNT);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <input
        type="text"
        maxLength={120}
        aria-label="Search foods in English or Spanish"
        placeholder="Search foods in English or Spanish"
        value={state.query}
        onChange={(e) => patch({ query: e.target.value })}
        style={{ ...input, marginTop: 12, flexShrink: 0 }}
      />
      <Label style={{ margin: '16px 0 4px' }}>{q ? 'RESULTS' : 'RECENT & FREQUENT'}</Label>
      <div className="scroll" style={{ flex: 1 }}>
        {results.map((f) => (
          <div
            key={f.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: `1px solid ${dim(0.07)}`,
            }}
          >
            <button
              onClick={() => dispatch({ type: 'addFood', item: f })}
              style={{ flex: 1, minHeight: 44, textAlign: 'left' }}
            >
              <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}>{f.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: dim(0.58), marginTop: 3 }}>
                {f.custom ? 'Saved by you · ' : ''}
                {macroLine(f)}
              </div>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Mono size={13}>{f.kcal}</Mono>
              <button
                className="press"
                onClick={() => dispatch({ type: 'addFood', item: f })}
                aria-label={`Add ${f.name}`}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: NUT,
                  color: ON_NUT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                +
              </button>
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <div style={{ fontSize: 14, color: dim(0.62), paddingTop: 14 }}>
            No match. Use Quick entry to log it in English, Spanish, or any language.
          </div>
        )}
      </div>
    </div>
  );
}

function QuickMode() {
  const { state, dispatch } = useApp();
  const d = state.draftFood;
  const set = (patch) => dispatch({ type: 'draftFood', patch });
  const kcal = toInt(d.kcal);

  const macroField = (field, placeholder, label) => (
    <input
      key={field}
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      aria-label={label}
      value={d[field]}
      onChange={(e) => set({ [field]: e.target.value })}
      style={{
        ...input,
        minWidth: 0,
        height: 48,
        padding: 0,
        textAlign: 'center',
        fontFamily: MONO,
        fontSize: 16,
      }}
    />
  );

  return (
    <div className="scroll fade-in" style={{ flex: 1, paddingTop: 14 }}>
      <Label style={{ marginBottom: 8 }}>NAME · ENGLISH OR ESPAÑOL</Label>
      <input
        type="text"
        maxLength={120}
        aria-label="Food name in English or Spanish"
        placeholder="e.g. Lasaña de mamá"
        value={d.name}
        onChange={(e) => set({ name: e.target.value })}
        style={{ ...input, width: '100%', boxSizing: 'border-box' }}
      />

      <Label style={{ margin: '18px 0 8px' }}>CALORIES</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BigStep label="Subtract 50" onClick={() => set({ kcal: String(Math.max(0, kcal - 50)) })}>
          −
        </BigStep>
        <input
          type="number"
          inputMode="numeric"
          placeholder="0"
          aria-label="Calories"
          value={d.kcal}
          onChange={(e) => set({ kcal: e.target.value })}
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
        <BigStep label="Add 50" onClick={() => set({ kcal: String(kcal + 50) })}>
          +
        </BigStep>
      </div>

      <Label style={{ margin: '18px 0 8px' }}>MACROS · GRAMS · OPTIONAL</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {macroField('p', 'P', 'Protein in grams')}
        {macroField('c', 'C', 'Carbohydrates in grams')}
        {macroField('f', 'F', 'Fat in grams')}
      </div>

      <CheckRow checked={d.save} accent={NUT} onClick={() => set({ save: !d.save })}>
        Save to my foods
      </CheckRow>

      <PrimaryButton
        background={NUT}
        color={ON_NUT}
        disabled={!kcal}
        style={{ marginTop: 20 }}
        onClick={() => dispatch({ type: 'quickAddFood' })}
      >
        Add {kcal > 0 ? `${kcal} kcal ` : ''}to {slotLabel(state.slot)}
      </PrimaryButton>
    </div>
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
