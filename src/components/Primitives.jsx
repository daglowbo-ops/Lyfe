import { MONO, dim, INK, ON_NUT, panel as panelStyle, card as cardStyle } from '../lib/theme.js';

const METADATA_SIZE = 12;

function metadataSize(size) {
  return typeof size === 'number' ? Math.max(METADATA_SIZE, size) : size;
}

function readableMetadataColor(color) {
  if (typeof color !== 'string') return color;
  const match = color.match(/^rgba\(233,\s*229,\s*220,\s*([0-9.]+)\)$/i);
  return match && Number(match[1]) < 0.58 ? dim(0.58) : color;
}

/** Monospaced tracking-out caption. The app's only section heading style. */
export function Label({ children, color = dim(0.62), size = METADATA_SIZE, style, as: Component = 'div' }) {
  const requestedSize = style?.fontSize ?? size;
  const requestedColor = style?.color ?? color;
  return (
    <Component
      style={{
        fontFamily: MONO,
        letterSpacing: 1.4,
        lineHeight: 1.35,
        ...style,
        fontSize: metadataSize(requestedSize),
        color: readableMetadataColor(requestedColor),
      }}
    >
      {children}
    </Component>
  );
}

/** Inline monospaced value, for numbers that sit next to prose. */
export function Mono({ children, color = dim(0.72), size = METADATA_SIZE, style }) {
  const requestedSize = style?.fontSize ?? size;
  const requestedColor = style?.color ?? color;
  return (
    <span
      style={{
        fontFamily: MONO,
        ...style,
        fontSize: metadataSize(requestedSize),
        color: readableMetadataColor(requestedColor),
      }}
    >
      {children}
    </span>
  );
}

export function ScreenTitle({ eyebrow, title, right }) {
  return (
    <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <Label>{eyebrow}</Label>
        <h1 style={{ margin: '5px 0 0', fontSize: 30, fontWeight: 600, letterSpacing: -1, lineHeight: 1.1 }}>
          {title}
        </h1>
      </div>
      {right}
    </header>
  );
}

export function Card({ children, style }) {
  return <div style={{ ...cardStyle, padding: '22px 20px 18px', ...style }}>{children}</div>;
}

export function Panel({ children, style }) {
  return <div style={{ ...panelStyle, ...style }}>{children}</div>;
}

/** One continuous comparison band; related metrics share a baseline and dividers. */
export function MetricBand({ items, style }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        borderTop: `1px solid ${dim(0.09)}`,
        borderBottom: `1px solid ${dim(0.09)}`,
        ...style,
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          style={{
            minWidth: 0,
            padding: '16px 14px 15px',
            paddingLeft: index === 0 ? 0 : 14,
            paddingRight: index === items.length - 1 ? 0 : 14,
            borderLeft: index === 0 ? 'none' : `1px solid ${dim(0.08)}`,
          }}
        >
          <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: -1.1, lineHeight: 1.05, color: item.valueColor }}>
            {item.value}
          </div>
          <Label color={item.color || dim(0.62)} style={{ marginTop: 6, letterSpacing: 1.05 }}>
            {item.label}
          </Label>
          {item.note && <div style={{ marginTop: 4, color: dim(0.56), fontSize: 12.5, lineHeight: 1.35 }}>{item.note}</div>}
        </div>
      ))}
    </div>
  );
}

/** Thin progress track. `color` fills, the rest stays at 10% ink. */
export function Meter({ value, color, height = 5, track = dim(0.1), label = 'Progress' }) {
  const scale = Math.max(0, Math.min(1, Number.parseFloat(value) / 100 || 0));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(scale * 100)}
      style={{ height, borderRadius: height / 2 + 1, background: track, overflow: 'hidden' }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: height / 2 + 1,
          background: color,
          width: '100%',
          transform: `scaleX(${scale})`,
          transformOrigin: 'left center',
          transition: 'transform .5s cubic-bezier(.2,.8,.2,1)',
        }}
      />
    </div>
  );
}

/** Two-state pill group — Month/Week, Search/Quick, Spending/Saved. */
export function SegmentedControl({ options, value, onChange, style, ariaLabel = 'View options' }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: dim(0.07), ...style }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 500,
              transition: 'background .25s, color .25s',
              background: on ? INK : 'transparent',
              color: on ? '#0D0D0C' : dim(0.6),
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Filter/category chip. Selected chips invert. */
export function Chip({ label, selected, onClick, accent = INK, height = 40 }) {
  const controlHeight = Math.max(44, Number(height) || 44);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        height: controlHeight,
        padding: '0 15px',
        borderRadius: controlHeight >= 44 ? 13 : 12,
        display: 'flex',
        alignItems: 'center',
        fontSize: 13.5,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'background .2s, color .2s, border-color .2s',
        border: `1px solid ${selected ? accent : dim(0.14)}`,
        background: selected ? accent : 'transparent',
        color: selected ? '#0D0D0C' : dim(0.65),
      }}
    >
      {label}
    </button>
  );
}

/** Full-width call to action in one of the module accents. */
export function PrimaryButton({ children, onClick, background, color, disabled, height = 52, style, type = 'button' }) {
  return (
    <button
      type={type}
      className="press"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      style={{
        width: '100%',
        height,
        minHeight: 44,
        borderRadius: 14,
        background,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: -0.2,
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'default' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Outlined secondary action. */
export function GhostButton({ children, onClick, height = 50, style, className = 'outline', type = 'button', disabled = false }) {
  return (
    <button
      type={type}
      className={className}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      style={{
        height,
        minHeight: 44,
        borderRadius: 14,
        border: `1px solid ${dim(0.14)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        color: dim(0.65),
        opacity: disabled ? 0.35 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Dashed "add another" affordance. */
export function AddButton({ children, onClick, accent = 'nut', height = 48, style }) {
  return (
    <button
      type="button"
      className={`outline-${accent}`}
      onClick={onClick}
      style={{
        width: '100%',
        height,
        minHeight: 44,
        borderRadius: 13,
        border: `1px dashed ${dim(0.18)}`,
        background: dim(0.03),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 14,
        color: dim(0.65),
        transition: 'border-color .2s, color .2s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** −/+ pair around a value. Used for weights, reps, amounts and set counts. */
export function Stepper({ value, onDown, onUp, height = 46, labelPrefix, downLabel, upLabel, disabled = false }) {
  const btn = {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 19,
    color: dim(0.65),
    borderRadius: 10,
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: Math.max(48, Number(height) || 48),
        borderRadius: 13,
        border: `1px solid ${dim(0.1)}`,
        background: '#131311',
        padding: '0 4px',
      }}
    >
      <button type="button" className="stepper" style={btn} onClick={onDown} disabled={disabled} aria-label={downLabel || 'Decrease value'}>
        −
      </button>
      <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 500, opacity: disabled ? 0.58 : 1 }}>
        {labelPrefix && <span style={{ color: dim(0.58) }}>{labelPrefix} </span>}
        {value}
      </span>
      <button type="button" className="stepper" style={btn} onClick={onUp} disabled={disabled} aria-label={upLabel || 'Increase value'}>
        +
      </button>
    </div>
  );
}

/** Square checkbox used in the two "save this for later" options. */
export function CheckRow({ checked, onClick, accent, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={checked}
      style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, height: 44 }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          transition: 'background .2s, border-color .2s',
          border: `1px solid ${checked ? accent : dim(0.2)}`,
          background: checked ? accent : 'transparent',
          color: ON_NUT,
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <span style={{ fontSize: 14, color: dim(0.7) }}>{children}</span>
    </button>
  );
}

/** Empty state inside a dashed frame. */
export function EmptyNote({ children, title, action, style }) {
  return (
    <div
      role="status"
      style={{
        marginTop: 24,
        padding: '30px 20px',
        borderRadius: 18,
        border: `1px dashed ${dim(0.14)}`,
        textAlign: 'center',
        fontSize: 15,
        color: dim(0.62),
        lineHeight: 1.5,
        ...style,
      }}
    >
      {title && <div style={{ color: INK, fontSize: 16, fontWeight: 600, letterSpacing: -0.25 }}>{title}</div>}
      <div style={{ marginTop: title ? 6 : 0 }}>{children}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function Avatar({ initials, onClick, size = 46 }) {
  const controlSize = Math.max(44, Number(size) || 44);
  const style = {
    width: controlSize,
    height: controlSize,
    borderRadius: '50%',
    border: `1px solid ${dim(0.16)}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: MONO,
    fontSize: controlSize > 50 ? 16 : 12,
    color: dim(0.7),
    flexShrink: 0,
  };
  if (!onClick) {
    return <div aria-hidden="true" style={style}>{initials}</div>;
  }
  return (
    <button
      type="button"
      className="outline"
      onClick={onClick}
      aria-label="Your profile"
      style={style}
    >
      {initials}
    </button>
  );
}
