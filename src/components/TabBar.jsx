import { MONO, dim, INK, MNY, NUT, TRN } from '../lib/theme.js';

// Icons are drawn from bare elements so they inherit `currentColor` and stay
// crisp at 15px without shipping an icon font.
const ICONS = {
  circle: <span style={{ width: 15, height: 15, borderRadius: '50%', border: '1.6px solid currentColor' }} />,
  square: <span style={{ width: 15, height: 15, borderRadius: 4, border: '1.6px solid currentColor' }} />,
  bars: (
    <span style={{ width: 17, height: 15, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <span style={{ height: 4, borderRadius: 2, background: 'currentColor' }} />
      <span style={{ height: 4, borderRadius: 2, background: 'currentColor', opacity: 0.45 }} />
    </span>
  ),
  calendar: (
    <span
      style={{
        width: 15,
        height: 15,
        borderRadius: 3,
        border: '1.6px solid currentColor',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 2,
        boxSizing: 'border-box',
      }}
    >
      <span style={{ width: 7, height: 2, background: 'currentColor' }} />
    </span>
  ),
  chart: (
    <span style={{ width: 15, height: 15, display: 'flex', alignItems: 'flex-end', gap: 2.5 }}>
      <span style={{ flex: 1, height: 6, background: 'currentColor', borderRadius: 1 }} />
      <span style={{ flex: 1, height: 11, background: 'currentColor', borderRadius: 1 }} />
      <span style={{ flex: 1, height: 15, background: 'currentColor', borderRadius: 1 }} />
    </span>
  ),
};

export const HEALTH_TABS = [
  { id: 'today', label: 'TODAY', icon: 'circle', accent: NUT },
  { id: 'food', label: 'FOOD', icon: 'square', accent: NUT },
  { id: 'train', label: 'TRAIN', icon: 'bars', accent: TRN },
  { id: 'plan', label: 'PLAN', icon: 'calendar', accent: TRN },
  { id: 'stats', label: 'STATS', icon: 'chart', accent: NUT },
];

export const MONEY_TABS = [
  { id: 'today', label: 'SPEND', icon: 'circle', accent: MNY },
  { id: 'budget', label: 'BUDGET', icon: 'bars', accent: MNY },
  { id: 'plan', label: 'PLAN', icon: 'calendar', accent: MNY },
  { id: 'stats', label: 'STATS', icon: 'chart', accent: MNY },
];

export default function TabBar({ tabs, active, onSelect }) {
  return (
    <nav
      aria-label="Primary navigation"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(13,13,12,.86)',
        backdropFilter: 'blur(18px)',
        borderTop: `1px solid ${dim(0.08)}`,
        display: 'flex',
        alignItems: 'flex-start',
        paddingTop: 11,
        paddingLeft: 8,
        paddingRight: 8,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 19px)',
        zIndex: 50,
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-current={on ? 'page' : undefined}
            style={{
              flex: 1,
              height: 58,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              transition: 'color .25s',
              color: on ? INK : dim(0.58),
              position: 'relative',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -11,
                width: 18,
                height: 2,
                borderRadius: '0 0 2px 2px',
                background: t.accent,
                opacity: on ? 1 : 0,
                transform: `scaleX(${on ? 1 : 0.35})`,
                transition: 'opacity .2s, transform .25s cubic-bezier(.2,.8,.2,1)',
              }}
            />
            <span aria-hidden="true" style={{ display: 'contents' }}>{ICONS[t.icon]}</span>
            <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 0.6 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
