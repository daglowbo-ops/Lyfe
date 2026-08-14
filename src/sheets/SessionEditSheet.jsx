import { useEffect, useMemo, useRef, useState } from 'react';
import Sheet from '../components/Sheet.jsx';
import { AddButton, GhostButton, Label, PrimaryButton } from '../components/Primitives.jsx';
import { useApp } from '../store/AppProvider.jsx';
import { INK, MONO, ON_TRN, TRN, dim, input } from '../lib/theme.js';

const SET_LIMITS = { min: 1, max: 12 };
const REP_LIMITS = { min: 1, max: 50 };

export default function SessionEditSheet() {
  const { state, dispatch, patch } = useApp();
  const close = () => patch({ editSheet: false });
  const known = state.templates.some((t) => t.name === state.curName);

  return (
    <Sheet title="Edit workout" onClose={close} height="90%">
      <input
        type="text"
        maxLength={80}
        aria-label="Workout name"
        value={state.curName}
        onChange={(e) => patch({ curName: e.target.value })}
        style={{ ...input, marginTop: 14, fontSize: 16, fontWeight: 500, flexShrink: 0 }}
      />

      <div style={{ margin: '18px 0 9px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <Label>EXERCISES</Label>
        <span style={{ fontSize: 12, color: dim(0.58), textAlign: 'right' }}>Type or swipe to adjust</span>
      </div>

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 10 }}>
              <NumberWheel
                id={`exercise-${i}-sets`}
                label="Sets"
                value={e.sets.length}
                {...SET_LIMITS}
                onChange={(value) => dispatch({ type: 'setSetCount', i, value })}
              />
              <NumberWheel
                id={`exercise-${i}-reps`}
                label="Reps"
                value={e.sets[0]?.r ?? REP_LIMITS.min}
                {...REP_LIMITS}
                onChange={(value) => dispatch({ type: 'setRepCount', i, value })}
              />
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

function NumberWheel({ id, label, value, min, max, onChange }) {
  const railRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const mountedRef = useRef(false);
  const [draft, setDraft] = useState(String(value));
  const values = useMemo(() => Array.from({ length: max - min + 1 }, (_, index) => min + index), [min, max]);

  useEffect(() => {
    setDraft(String(value));
    const rail = railRef.current;
    const option = rail?.querySelector(`[data-wheel-value="${value}"]`);
    if (!rail || !option) return;

    const left = option.offsetLeft - ((rail.clientWidth - option.offsetWidth) / 2);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollTo({ left, behavior: mountedRef.current && !reduceMotion ? 'smooth' : 'auto' });
    mountedRef.current = true;
  }, [value]);

  useEffect(() => () => window.clearTimeout(scrollTimerRef.current), []);

  const commit = (nextValue) => {
    const parsed = Number.parseInt(nextValue, 10);
    const bounded = Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : value;
    setDraft(String(bounded));
    if (bounded !== value) onChange(bounded);
  };

  const settleScroll = () => {
    window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      const rail = railRef.current;
      if (!rail) return;
      const center = rail.scrollLeft + (rail.clientWidth / 2);
      let nearest = null;
      let distance = Number.POSITIVE_INFINITY;
      rail.querySelectorAll('[data-wheel-value]').forEach((option) => {
        const optionCenter = option.offsetLeft + (option.offsetWidth / 2);
        const nextDistance = Math.abs(optionCenter - center);
        if (nextDistance < distance) {
          nearest = option;
          distance = nextDistance;
        }
      });
      if (nearest) commit(nearest.dataset.wheelValue);
    }, 90);
  };

  const moveBy = (delta) => commit(value + delta);

  return (
    <div
      style={{
        minWidth: 0,
        border: `1px solid ${dim(0.1)}`,
        borderRadius: 13,
        background: '#131311',
        padding: 8,
      }}
    >
      <div style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <label
          htmlFor={`${id}-input`}
          style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: dim(0.62) }}
        >
          {label}
        </label>
        <input
          id={`${id}-input`}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step="1"
          aria-label={`${label} manual value`}
          value={draft}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              setDraft(String(value));
              event.currentTarget.blur();
            }
          }}
          style={{
            width: 54,
            height: 44,
            borderRadius: 10,
            border: `1px solid ${dim(0.16)}`,
            background: '#0D0D0C',
            color: INK,
            padding: '0 5px',
            fontFamily: MONO,
            fontSize: 16,
            fontWeight: 600,
            textAlign: 'center',
          }}
        />
      </div>

      <div
        ref={railRef}
        className="hscroll"
        role="slider"
        tabIndex={0}
        aria-label={`${label} swipe selector`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} ${label.toLowerCase()}`}
        onScroll={settleScroll}
        onWheel={(event) => {
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          event.preventDefault();
          railRef.current?.scrollBy({ left: event.deltaY, behavior: 'auto' });
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            event.preventDefault();
            moveBy(-1);
          } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            event.preventDefault();
            moveBy(1);
          } else if (event.key === 'Home') {
            event.preventDefault();
            commit(min);
          } else if (event.key === 'End') {
            event.preventDefault();
            commit(max);
          }
        }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          height: 48,
          marginTop: 6,
          padding: '0 calc(50% - 22px)',
          borderRadius: 10,
          border: `1px solid ${dim(0.07)}`,
          background: '#0D0D0C',
          scrollSnapType: 'x mandatory',
          overscrollBehaviorX: 'contain',
          touchAction: 'pan-x',
        }}
      >
        {values.map((optionValue) => {
          const selected = optionValue === value;
          return (
            <button
              key={optionValue}
              type="button"
              tabIndex={-1}
              data-wheel-value={optionValue}
              aria-label={`Set ${label.toLowerCase()} to ${optionValue}`}
              aria-pressed={selected}
              onClick={() => commit(optionValue)}
              style={{
                width: 44,
                minWidth: 44,
                height: 44,
                scrollSnapAlign: 'center',
                borderRadius: 9,
                background: selected ? TRN : 'transparent',
                color: selected ? ON_TRN : dim(0.55),
                fontFamily: MONO,
                fontSize: selected ? 15 : 12,
                fontWeight: selected ? 600 : 400,
                transform: selected ? 'scale(1)' : 'scale(.92)',
                transition: 'background .18s, color .18s, transform .18s, font-size .18s',
              }}
            >
              {optionValue}
            </button>
          );
        })}
      </div>
    </div>
  );
}
