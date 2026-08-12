import { useId, useRef } from 'react';
import { useApp } from '../store/AppProvider.jsx';
import { WARN, dim } from '../lib/theme.js';

/**
 * Drag a row left to reveal a delete button. Only one row can be open at a
 * time, so the open row is tracked in app state rather than per-component.
 *
 * The visible actions button provides the keyboard path. The destructive
 * action only enters the tab order once its rail has been deliberately opened.
 */
export default function SwipeRow({ id, onDelete, children, deleteLabel = 'Delete' }) {
  const { state, dispatch } = useApp();
  const actionsRef = useRef(null);
  const actionId = useId();
  const swipe = state.swipe;
  const open = swipe.id === id;
  const dx = open ? swipe.x : 0;

  const reveal = () => {
    dispatch({ type: 'swipeStart', id, x: 0 });
    dispatch({ type: 'swipeMove', x: -96 });
    dispatch({ type: 'swipeEnd' });
  };

  const close = () => {
    dispatch({ type: 'swipeReset' });
    actionsRef.current?.focus({ preventScroll: true });
  };

  return (
    <div
      className="fade-in"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          close();
        }
      }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div
        onPointerDown={(e) => dispatch({ type: 'swipeStart', id, x: e.clientX })}
        onPointerMove={(e) => dispatch({ type: 'swipeMove', x: e.clientX })}
        onPointerUp={() => dispatch({ type: 'swipeEnd' })}
        onPointerLeave={() => dispatch({ type: 'swipeEnd' })}
        onPointerCancel={() => dispatch({ type: 'swipeEnd' })}
        style={{
          position: 'relative',
          zIndex: 1,
          background: '#0D0D0C',
          touchAction: 'pan-y',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'stretch',
          transform: `translateX(${dx}px)`,
          transition: swipe.dragging && open ? 'none' : 'transform .26s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        <button
          ref={actionsRef}
          type="button"
          aria-label={open ? 'Hide item actions' : 'Show item actions'}
          aria-expanded={open}
          aria-controls={actionId}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={open ? close : reveal}
          style={{
            width: 44,
            minHeight: 44,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: dim(0.65),
          }}
        >
          <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {[0, 1, 2].map((dot) => (
              <span key={dot} style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor' }} />
            ))}
          </span>
        </button>
      </div>
      <button
        id={actionId}
        type="button"
        aria-label={deleteLabel}
        tabIndex={open ? 0 : -1}
        aria-hidden={open ? undefined : 'true'}
        onClick={() => {
          dispatch({ type: 'swipeReset' });
          onDelete();
        }}
        style={{
          position: 'absolute',
          zIndex: 0,
          right: 0,
          top: 0,
          bottom: 1,
          width: 88,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          background: WARN,
          color: '#1B0A05',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <span aria-hidden="true">Delete</span>
      </button>
    </div>
  );
}
