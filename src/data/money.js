export const CATEGORIES = ['Mercado', 'Comer fuera', 'Transporte', 'Hogar', 'Ocio', 'Salud', 'Otros'];

export const CATEGORY_LABELS = {
  Mercado: 'Groceries',
  'Comer fuera': 'Eating out',
  Transporte: 'Transport',
  Hogar: 'Home',
  Ocio: 'Leisure',
  Salud: 'Health',
  Otros: 'Other',
};

export const categoryLabel = (category) => CATEGORY_LABELS[category] || category;

export const DEFAULT_BUDGETS = [
  { cat: 'Mercado', limit: 1800 },
  { cat: 'Comer fuera', limit: 900 },
  { cat: 'Transporte', limit: 500 },
  { cat: 'Hogar', limit: 3600 },
  { cat: 'Ocio', limit: 700 },
  { cat: 'Salud', limit: 450 },
  { cat: 'Otros', limit: 550 },
];

export const DEFAULT_INCOME = 11500;

export const DEFAULT_FAVOURITES = [
  { label: 'Café', amt: 18, cat: 'Comer fuera' },
  { label: 'Trufi', amt: 6, cat: 'Transporte' },
  { label: 'Mercado', amt: 85, cat: 'Mercado' },
];

/** Recurring bills, keyed by day of month. */
export const DEFAULT_BILLS = [
  { id: 'rent', name: 'Rent', day: 1, amt: 2800 },
  { id: 'internet', name: 'Internet', day: 12, amt: 280 },
  { id: 'gym', name: 'Gym', day: 15, amt: 250 },
  { id: 'mobile', name: 'Mobile', day: 18, amt: 120 },
  { id: 'utilities', name: 'Utilities', day: 24, amt: 310 },
];

// Kept as an alias for older imports.
export const BILLS = DEFAULT_BILLS;

// Plausible labels and amount ranges per category, used only to seed a first run.
export const SAMPLE_LABELS = {
  Mercado: ['Mercado', 'Supermercado', 'Tienda de barrio'],
  'Comer fuera': ['Almuerzo', 'Café', 'Salteñas', 'Cena fuera'],
  Transporte: ['Trufi', 'Gasolina', 'Taxi'],
  Hogar: ['Luz y agua', 'Internet', 'Ferretería'],
  Ocio: ['Cine', 'Salida', 'Escalada'],
  Salud: ['Farmacia', 'Suplementos'],
  Otros: ['Regalo', 'Trámites'],
};

export const SAMPLE_RANGES = {
  Mercado: [25, 180],
  'Comer fuera': [12, 95],
  Transporte: [5, 60],
  Hogar: [40, 220],
  Ocio: [20, 140],
  Salud: [18, 110],
  Otros: [10, 90],
};
