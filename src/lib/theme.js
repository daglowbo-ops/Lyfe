// Fieldnote palette. Accent hues stay in oklch so the three modules read as one
// family: nutrition (green), training (amber), money (blue), warning (red).
export const NUT = 'oklch(0.84 0.15 135)';
export const TRN = 'oklch(0.84 0.15 55)';
export const MNY = 'oklch(0.84 0.15 245)';
export const WARN = 'oklch(0.76 0.16 30)';

// Ink on top of each accent.
export const ON_NUT = '#0D1A0C';
export const ON_TRN = '#14100A';
export const ON_MNY = '#08131F';

export const INK = '#E9E5DC';
export const BG = '#0D0D0C';
export const CARD = '#1A1A17';
export const PANEL = '#111110';
export const FIELD = '#0D0D0C';

// Ink at reduced strength — the design leans on these constantly.
export const dim = (a) => `rgba(233,229,220,${a})`;
export const DIM = dim(0.13);

export const MONO = "'JetBrains Mono', ui-monospace, monospace";

/** The big rounded surface used for hero cards. */
export const card = {
  border: `1px solid ${dim(0.16)}`,
  borderRadius: 22,
  background: CARD,
  boxShadow: '0 10px 28px rgba(0,0,0,.38)',
};

/** The quieter surface used for secondary panels. */
export const panel = {
  border: `1px solid ${dim(0.06)}`,
  borderRadius: 20,
  padding: 18,
  background: PANEL,
};

export const input = {
  height: 46,
  borderRadius: 13,
  border: `1px solid ${dim(0.12)}`,
  background: FIELD,
  color: INK,
  padding: '0 14px',
  fontFamily: 'Outfit, sans-serif',
  fontSize: 15,
  outline: 'none',
};
