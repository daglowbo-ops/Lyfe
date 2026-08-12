import { useId, useLayoutEffect, useRef } from 'react';
import { dim } from '../lib/theme.js';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableElements(dialog) {
  return [...dialog.querySelectorAll(FOCUSABLE)].filter(
    (element) => element.tabIndex >= 0 && !element.closest('[hidden], [aria-hidden="true"]'),
  );
}

/**
 * Bottom sheet. Scrim closes it, as does Escape — the "Done" button is the
 * visible affordance but neither should be the only way out.
 */
export default function Sheet({ title, onClose, children, height, maxHeight = '76%' }) {
  const rootRef = useRef(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  closeRef.current = onClose;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    if (!root || !dialog) return undefined;

    const background = [...root.parentElement.children]
      .filter((element) => element !== root)
      .map((element) => ({
        element,
        inert: element.inert,
        ariaHidden: element.getAttribute('aria-hidden'),
      }));

    background.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });

    const initialFocus =
      dialog.querySelector('[data-sheet-initial-focus]') ||
      dialog.querySelector('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])') ||
      dialog.querySelector('button:not([disabled]):not([data-sheet-close])') ||
      dialog;

    initialFocus.focus({ preventScroll: true });

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = focusableElements(dialog);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      background.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      });
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
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
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,7,.6)', backdropFilter: 'blur(3px)' }}
      />
      <div
        ref={dialogRef}
        className="sheet-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
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
          <h2 id={titleId} style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: -0.6 }}>
            {title}
          </h2>
          <button
            type="button"
            data-sheet-close
            className="muted-link"
            onClick={onClose}
            style={{
              height: 44,
              padding: '0 12px',
              marginRight: -10,
              display: 'flex',
              alignItems: 'center',
              fontSize: 15,
              color: dim(0.65),
            }}
          >
            Done
          </button>
        </div>
        <div style={{ minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
      </div>
    </div>
  );
}
