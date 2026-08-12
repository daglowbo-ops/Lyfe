export const REST_DAY = 'Descanso';

// [name, sets, reps, weight, "last time" note]
const RAW = [
  {
    name: 'Push A',
    ex: [
      ['Press inclinado', 4, 8, 80, '77.5 kg × 8'],
      ['Press militar', 3, 8, 50, '50 kg × 8'],
      ['Aperturas en polea', 3, 12, 25, '22.5 kg × 12'],
      ['Tríceps en cuerda', 3, 12, 32.5, '30 kg × 12'],
    ],
  },
  {
    name: 'Pull A',
    ex: [
      ['Remo con barra', 4, 6, 95, '92.5 kg × 6'],
      ['Jalón al pecho', 3, 10, 70, '67.5 kg × 10'],
      ['Face pull', 3, 15, 25, '25 kg × 15'],
      ['Curl con barra', 3, 10, 35, '32.5 kg × 10'],
    ],
  },
  {
    name: 'Legs A',
    ex: [
      ['Sentadilla trasera', 4, 5, 132.5, '130 kg × 5'],
      ['Peso muerto rumano', 3, 8, 100, '97.5 kg × 8'],
      ['Prensa de piernas', 3, 12, 180, '180 kg × 12'],
      ['Elevación de gemelos', 4, 15, 60, '60 kg × 15'],
    ],
  },
  {
    name: 'Upper A',
    ex: [
      ['Press banca', 4, 6, 95, '92.5 kg × 6'],
      ['Dominadas lastradas', 4, 6, 10, '7.5 kg × 6'],
      ['Remo sentado', 3, 10, 75, '72.5 kg × 10'],
      ['Elevaciones laterales', 3, 15, 12, '12 kg × 15'],
    ],
  },
  {
    name: 'Lower A',
    ex: [
      ['Sentadilla frontal', 4, 6, 95, '92.5 kg × 6'],
      ['Empuje de cadera', 3, 10, 120, '115 kg × 10'],
      ['Curl femoral', 3, 12, 55, '52.5 kg × 12'],
      ['Gemelos de pie', 4, 12, 70, '70 kg × 12'],
    ],
  },
];

const inflate = (t) =>
  t.ex.map(([name, setCount, reps, weight, last]) => ({
    name,
    last,
    sets: Array.from({ length: setCount }, () => ({ w: weight, r: reps, d: false })),
  }));

export const seedTemplates = () => RAW.map((t) => ({ name: t.name, exercises: inflate(t) }));

export const seedWorkout = () => inflate(RAW[0]);

/** Copy a template's shape but clear every completion mark. */
export const freshCopy = (exercises) =>
  exercises.map((e) => ({
    name: e.name,
    last: e.last,
    sets: e.sets.map((s) => ({ w: s.w, r: s.r, d: false })),
  }));

export const blankExercise = () => ({
  name: 'New exercise',
  last: '—',
  sets: [{ w: 20, r: 10, d: false }],
});

/** The rotation the plan falls back to for any day the user has not set. */
export const DEFAULT_CYCLE = ['Push A', 'Pull A', REST_DAY, 'Legs A', 'Push B', 'Pull B', REST_DAY];
