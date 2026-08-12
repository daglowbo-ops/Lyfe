import { useApp } from '../store/AppProvider.jsx';
import { WARN } from '../lib/theme.js';

/**
 * Drag a row left to reveal a delete button. Only one row can be open at a
 * time, so the open row is tracked in app state rather than per-component.
 *
 * The row also carries a keyboard path: the Borrar button stays in the tab
 * order, so deletion never depends on being able to perform a drag.
 */
export default function SwipeRow({ id, onDelete, children, deleteLabel = 'Delete' }) {
  const { state, dispatch } = useApp();
  const swipe = state.swipe;
  const open = swipe.id === id;
  const dx = open ? swipe.x : 0;

  return (
    <div className="fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
      <button
        onClick={() => {
          dispatch({ type: 'swipeReset' });
          onDelete();
        }}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 1,
          width: 88,
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
        {deleteLabel}
      </button>
      <div
        onPointerDown={(e) => dispatch({ type: 'swipeStart', id, x: e.clientX })}
        onPointerMove={(e) => dispatch({ type: 'swipeMove', x: e.clientX })}
        onPointerUp={() => dispatch({ type: 'swipeEnd' })}
        onPointerLeave={() => dispatch({ type: 'swipeEnd' })}
        style={{
          position: 'relative',
          background: '#0D0D0C',
          touchAction: 'pan-y',
          cursor: 'grab',
          transform: `translateX(${dx}px)`,
          transition: swipe.dragging && open ? 'none' : 'transform .26s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
