import { dim, INK, MNY, NUT, TRN } from '../lib/theme.js';

/**
 * Floats above every screen. Salud and Dinero are two separate apps sharing a
 * shell, so this stays visible rather than living inside either tab bar.
 */
export default function ModuleSwitch({ module, onChange }) {
  const pill = (id, label) => {
    const on = module === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        aria-pressed={on}
        style={{
          height: 44,
          padding: '0 22px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          fontSize: 14,
          fontWeight: 500,
          transition: 'background .25s, color .25s',
          background: on ? INK : 'transparent',
          color: on ? '#0D0D0C' : dim(0.62),
          gap: 8,
        }}
      >
        <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {id === 'health' ? (
            <>
              <span style={{ width: 4, height: 4, borderRadius: 2, background: NUT, opacity: on ? 1 : 0.5 }} />
              <span style={{ width: 4, height: 4, borderRadius: 2, background: TRN, opacity: on ? 1 : 0.5 }} />
            </>
          ) : (
            <span style={{ width: 10, height: 4, borderRadius: 2, background: MNY, opacity: on ? 1 : 0.5 }} />
          )}
        </span>
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 45,
        pointerEvents: 'none',
      }}
    >
      <div
        role="group"
        aria-label="Choose module"
        style={{
          display: 'flex',
          gap: 3,
          padding: 3,
          borderRadius: 15,
          background: 'rgba(32,32,29,.92)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${dim(0.09)}`,
          pointerEvents: 'auto',
        }}
      >
        {pill('health', 'Health')}
        {pill('money', 'Money')}
      </div>
    </div>
  );
}
