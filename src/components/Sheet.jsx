import { useEffect } from 'react';
import { dim } from '../lib/theme.js';

/**
 * Bottom sheet. Scrim closes it, as does Escape — the "Listo" button is the
 * visible affordance but neither should be the only way out.
 */
export default function Sheet({ title, onClose, children, height, maxHeight = '76%' }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        className="fade-in"
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,7,.6)', backdropFilter: 'blur(3px)' }}
      />
      <div
        className="sheet-in"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'relative',
          background: '#141412',
          borderTop: `1px solid ${dim(0.12)}`,
          borderRadius: '26px 26px 0 0',
          padding: '12px 20px 34px',
          height,
          maxHeight: height ? undefined : maxHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{ width: 38, height: 4, borderRadius: 3, background: dim(0.2), margin: '0 auto 16px' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.6 }}>{title}</div>
          <button
            className="muted-link"
            onClick={onClose}
            style={{
              height: 40,
              padding: '0 12px',
              marginRight: -10,
              display: 'flex',
              alignItems: 'center',
              fontSize: 15,
              color: dim(0.55),
            }}
          >
            Done
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
