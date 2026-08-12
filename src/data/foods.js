export const SLOTS = ['Desayuno', 'Almuerzo', 'Cena', 'Snacks'];
export const SLOT_LABELS = { Desayuno: 'Breakfast', Almuerzo: 'Lunch', Cena: 'Dinner', Snacks: 'Snacks' };
export const slotLabel = (slot) => SLOT_LABELS[slot] || slot;

export const CATALOG = [
  { name: 'Avena, 60 g', kcal: 228, p: 8, c: 40, f: 4 },
  { name: 'Yogur griego, 170 g', kcal: 100, p: 17, c: 6, f: 0 },
  { name: 'Plátano mediano', kcal: 105, p: 1, c: 27, f: 0 },
  { name: 'Pechuga de pollo, 200 g', kcal: 330, p: 62, c: 0, f: 7 },
  { name: 'Arroz blanco, 1 taza', kcal: 205, p: 4, c: 45, f: 0 },
  { name: 'Palta, media', kcal: 160, p: 2, c: 9, f: 15 },
  { name: 'Batido de proteína, 1 medida', kcal: 120, p: 24, c: 3, f: 1 },
  { name: 'Huevos, dos', kcal: 156, p: 13, c: 1, f: 11 },
  { name: 'Salmón, 170 g', kcal: 367, p: 40, c: 0, f: 22 },
  { name: 'Almendras, 30 g', kcal: 173, p: 6, c: 6, f: 15 },
  { name: 'Mantequilla de maní, 2 cdas', kcal: 188, p: 8, c: 6, f: 16 },
  { name: 'Pan integral, 1 rebanada', kcal: 120, p: 4, c: 23, f: 1 },
  { name: 'Queso cottage, 150 g', kcal: 120, p: 17, c: 5, f: 3 },
  { name: 'Aceite de oliva, 1 cda', kcal: 119, p: 0, c: 0, f: 14 },
];
