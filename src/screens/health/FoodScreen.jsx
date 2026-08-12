import Screen from '../../components/Screen.jsx';
import SwipeRow from '../../components/SwipeRow.jsx';
import { AddButton, EmptyNote, Label, Meter, Mono } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { dayTotals } from '../../store/selectors.js';
import { SLOTS, slotLabel } from '../../data/foods.js';
import { fullLabel, startOfToday } from '../../lib/date.js';
import { macroLine, pct } from '../../lib/format.js';
import { MONO, NUT, dim } from '../../lib/theme.js';

export default function FoodScreen() {
  const { state, dispatch } = useApp();
  const totals = dayTotals(state.meals);

  return (
    <Screen>
      <Label>{fullLabel(startOfToday())}</Label>
      <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1, margin: '5px 0 0' }}>Food log</h1>

      <div
        style={{
          marginTop: 18,
          paddingBottom: 18,
          borderBottom: `1px solid ${dim(0.09)}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -2, lineHeight: 1 }}>{totals.kcal}</div>
          <div style={{ fontSize: 13, color: dim(0.62) }}>
            of {state.goals.kcal} kcal
          </div>
        </div>
        <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 12, color: dim(0.62), lineHeight: 1.5 }}>
          {macroLine(totals)}
        </div>
        <div style={{ marginTop: 12 }}>
          <Meter value={pct(totals.kcal, state.goals.kcal)} color={NUT} height={4} track={dim(0.09)} label="Daily calories logged" />
        </div>
      </div>

      {SLOTS.map((slot) => {
        const items = state.meals.filter((m) => m.slot === slot);
        return (
          <div key={slot} style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label>{slotLabel(slot).toUpperCase()}</Label>
              <Mono color={dim(0.55)}>{items.reduce((a, m) => a + m.kcal, 0)} kcal</Mono>
            </div>

            <div style={{ marginTop: 6 }}>
              {items.map((m) => (
                <SwipeRow key={m.id} id={m.id} onDelete={() => dispatch({ type: 'removeFood', id: m.id })}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '13px 0',
                      borderBottom: `1px solid ${dim(0.07)}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2 }}>{m.name}</div>
                      <div style={{ fontFamily: MONO, fontSize: 12, color: dim(0.58), marginTop: 3 }}>
                        {macroLine(m)}
                      </div>
                    </div>
                    <Mono size={13} color={dim(0.75)} style={{ paddingLeft: 14 }}>
                      {m.kcal}
                    </Mono>
                  </div>
                </SwipeRow>
              ))}
              {items.length === 0 && (
                <EmptyNote style={{ marginTop: 8, padding: '18px 16px', textAlign: 'left' }}>
                  No {slotLabel(slot).toLowerCase()} logged yet.
                </EmptyNote>
              )}
            </div>

            <AddButton
              style={{ marginTop: 10 }}
              onClick={() => dispatch({ type: 'openFoodSheet', slot })}
            >
              Add to {slotLabel(slot)}
            </AddButton>
          </div>
        );
      })}
    </Screen>
  );
}
