const LOCALE = 'en-BO';
export const KG_TO_LB = 2.2046226218;

export const money = (n) =>
  'Bs ' +
  (Math.round(n * 100) / 100).toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const money0 = (n) => 'Bs ' + Math.round(n).toLocaleString(LOCALE);

export const pct = (a, b) => Math.min(100, Math.round((a / (b || 1)) * 100)) + '%';

/** Digits only — the numeric fields must never accept a stray minus or letter. */
export const toInt = (v) => Math.max(0, parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0);

export const toFloat = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const macroLine = (m) => `Protein ${m.p} g · Carbs ${m.c} g · Fat ${m.f} g`;

export const displayWeight = (kg, useKg = true, digits = 1) => {
  const value = useKg ? kg : kg * KG_TO_LB;
  return Number(value.toFixed(digits));
};

export const storedWeight = (value, useKg = true) => {
  const n = toFloat(value);
  return n ? n / (useKg ? 1 : KG_TO_LB) : 0;
};

export const weightUnit = (useKg = true) => (useKg ? 'kg' : 'lb');
