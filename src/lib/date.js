export const DOWS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const DOW_LONG = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const MON_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const MON_LONG = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

/** Stable YYYY-MM-DD key, in local time (never UTC — day boundaries must match the user's). */
export const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const parseKey = (k) => new Date(`${k}T00:00:00`);

/** Midnight today, so every comparison in the app has one definition of "now". */
export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addDays = (d, n) => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};

export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

/** Monday-first weekday index. */
export const dowIndex = (d) => (d.getDay() + 6) % 7;

export const daysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

export const monthLabel = (d) => `${MON_LONG[d.getMonth()]} ${d.getFullYear()}`;

/** "LUN 10 AGO 2026" */
export const fullLabel = (d) =>
  `${DOW_LONG[dowIndex(d)]} ${d.getDate()} ${MON_SHORT[d.getMonth()]} ${d.getFullYear()}`;

/** "10 ago" */
export const shortLabel = (d) => `${d.getDate()} ${MON_SHORT[d.getMonth()].toLowerCase()}`;

/**
 * The 6x7 grid for a month view, Monday-first. Always 42 cells so the calendar
 * never changes height between months.
 */
export function monthGrid(monthStart) {
  const lead = dowIndex(monthStart);
  return Array.from({ length: 42 }, (_, i) =>
    new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 + i - lead),
  );
}
