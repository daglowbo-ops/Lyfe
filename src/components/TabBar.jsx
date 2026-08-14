import { MONO, dim, INK, MNY, NUT, TRN } from '../lib/theme.js';

export const HEALTH_TABS = [
  { id: 'today', label: 'TODAY', icon: 'today', accent: NUT },
  { id: 'food', label: 'FOOD', icon: 'food', accent: NUT },
  { id: 'train', label: 'TRAIN', icon: 'train', accent: TRN },
  { id: 'plan', label: 'PLAN', icon: 'calendar', accent: TRN },
  { id: 'stats', label: 'STATS', icon: 'chart', accent: NUT },
];

export const MONEY_TABS = [
  { id: 'today', label: 'SPEND', icon: 'spend', accent: MNY },
  { id: 'budget', label: 'BUDGET', icon: 'budget', accent: MNY },
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
            className="tab-action"
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
              transition: 'color .28s cubic-bezier(.16,1,.3,1)',
              color: on ? INK : dim(0.58),
              position: 'relative',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -11,
                width: 22,
                height: 2,
                borderRadius: 2,
                background: t.accent,
                opacity: on ? 1 : 0,
                transform: `scaleX(${on ? 1 : 0.35})`,
                transition: 'opacity .2s, transform .25s cubic-bezier(.2,.8,.2,1)',
              }}
            />
            <span
              aria-hidden="true"
              style={{
                display: 'flex',
                transform: on ? 'translateY(-1px) scale(1.06)' : 'none',
                transition: 'transform .34s cubic-bezier(.16,1,.3,1)',
              }}
            >
              <NavIcon name={t.icon} />
            </span>
            <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 0.6 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Purpose-built, single-stroke fieldbook icons. */
function NavIcon({ name }) {
  const common = {
    width: 19,
    height: 19,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.55,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'today') return (
    <svg {...common}>
      <circle cx="10" cy="10" r="6.7" />
      <circle cx="10" cy="10" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  );
  if (name === 'food') return (
    <svg {...common}>
      <path d="M3.3 9.2h13.4c-.4 4-2.7 6-6.7 6s-6.3-2-6.7-6Z" />
      <path d="M6.2 6.6c.8-1.4 2-2.1 3.8-2.1 1.7 0 3 .7 3.8 2.1" />
      <path d="M7.4 17h5.2" />
    </svg>
  );
  if (name === 'train') return (
    <svg {...common}>
      <path d="M2.8 7.2v5.6M5.3 5.8v8.4M14.7 5.8v8.4M17.2 7.2v5.6M5.3 10h9.4" />
    </svg>
  );
  if (name === 'calendar') return (
    <svg {...common}>
      <rect x="3.1" y="4.5" width="13.8" height="12.1" rx="2.2" />
      <path d="M6.5 2.9v3.2M13.5 2.9v3.2M3.1 8h13.8" />
      <path d="M6.4 11.2h1.2M9.4 11.2h1.2M12.4 11.2h1.2M6.4 14h1.2M9.4 14h1.2" />
    </svg>
  );
  if (name === 'spend') return (
    <svg {...common}>
      <path d="M4 5.2h12v10.2H4z" />
      <path d="M4 7.8h12M7 12h3.8M13.6 12h.1" />
    </svg>
  );
  if (name === 'budget') return (
    <svg {...common}>
      <path d="M3.2 5.3h13.6M3.2 10h13.6M3.2 14.7h13.6" />
      <circle cx="7" cy="5.3" r="1.8" fill="var(--bg)" />
      <circle cx="13" cy="10" r="1.8" fill="var(--bg)" />
      <circle cx="9" cy="14.7" r="1.8" fill="var(--bg)" />
    </svg>
  );
  return (
    <svg {...common}>
      <path d="M3.5 16.5V11M8 16.5V7.5M12.5 16.5V4M17 16.5V9" />
    </svg>
  );
}
