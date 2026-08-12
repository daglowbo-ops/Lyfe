export const SLOTS = ['Desayuno', 'Almuerzo', 'Cena', 'Snacks'];
export const SLOT_LABELS = { Desayuno: 'Breakfast', Almuerzo: 'Lunch', Cena: 'Dinner', Snacks: 'Snacks' };
export const slotLabel = (slot) => SLOT_LABELS[slot] || slot;

export const CATALOG = [
  { name: 'Rolled oats, 60 g', aliases: ['Avena, 60 g'], kcal: 228, p: 8, c: 40, f: 4 },
  { name: 'Greek yogurt, 170 g', aliases: ['Yogur griego, 170 g'], kcal: 100, p: 17, c: 6, f: 0 },
  { name: 'Medium banana', aliases: ['Plátano mediano', 'Banano mediano'], kcal: 105, p: 1, c: 27, f: 0 },
  { name: 'Chicken breast, 200 g', aliases: ['Pechuga de pollo, 200 g'], kcal: 330, p: 62, c: 0, f: 7 },
  { name: 'White rice, 1 cup', aliases: ['Arroz blanco, 1 taza'], kcal: 205, p: 4, c: 45, f: 0 },
  { name: 'Half avocado', aliases: ['Palta, media', 'Aguacate, medio'], kcal: 160, p: 2, c: 9, f: 15 },
  { name: 'Protein shake, 1 scoop', aliases: ['Batido de proteína, 1 medida'], kcal: 120, p: 24, c: 3, f: 1 },
  { name: 'Two eggs', aliases: ['Huevos, dos'], kcal: 156, p: 13, c: 1, f: 11 },
  { name: 'Salmon, 170 g', aliases: ['Salmón, 170 g'], kcal: 367, p: 40, c: 0, f: 22 },
  { name: 'Almonds, 30 g', aliases: ['Almendras, 30 g'], kcal: 173, p: 6, c: 6, f: 15 },
  { name: 'Peanut butter, 2 tbsp', aliases: ['Mantequilla de maní, 2 cdas'], kcal: 188, p: 8, c: 6, f: 16 },
  { name: 'Whole wheat bread, 1 slice', aliases: ['Pan integral, 1 rebanada'], kcal: 120, p: 4, c: 23, f: 1 },
  { name: 'Cottage cheese, 150 g', aliases: ['Queso cottage, 150 g'], kcal: 120, p: 17, c: 5, f: 3 },
  { name: 'Olive oil, 1 tbsp', aliases: ['Aceite de oliva, 1 cda'], kcal: 119, p: 0, c: 0, f: 14 },
];

const foldSearchText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase();

export function foodMatchesQuery(food, query) {
  const needle = foldSearchText(query).trim();
  if (!needle) return true;
  return [food.name, ...(food.aliases || [])].some((value) => foldSearchText(value).includes(needle));
}
