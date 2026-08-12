import { PrimaryButton } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { authenticateDeviceLock } from '../../lib/deviceLock.js';
import { MNY, ON_MNY, WARN, dim } from '../../lib/theme.js';

export default function LockScreen() {
  const { state, dispatch, patch } = useApp();

  const unlock = async () => {
    dispatch({ type: 'lockStatus', busy: true });
    try {
      await authenticateDeviceLock();
      patch({ locked: false, lockBusy: false, lockError: '' });
    } catch (error) {
      dispatch({ type: 'lockStatus', busy: false, error: error?.message || 'Your device could not verify you.' });
    }
  };

  return (
    <div className="fade-in" style={{ position: 'absolute', inset: 0, zIndex: 55, background: '#0D0D0C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '0 40px' }}>
      <div style={{ width: 78, height: 78, borderRadius: '50%', border: `1.5px solid ${dim(0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 26, height: 22, borderRadius: 5, border: `1.5px solid ${MNY}` }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.7 }}>Money is locked</div>
        <div style={{ fontSize: 14, color: dim(0.5), marginTop: 8, lineHeight: 1.5 }}>
          Verify with this device's fingerprint, face, PIN, or screen lock to view balances and transactions.
        </div>
      </div>
      {state.lockError && <div role="alert" style={{ maxWidth: 320, textAlign: 'center', color: WARN, fontSize: 13, lineHeight: 1.45 }}>{state.lockError}</div>}
      <PrimaryButton
        background={MNY}
        color={ON_MNY}
        disabled={state.lockBusy}
        height={54}
        style={{ width: 'auto', padding: '0 30px', borderRadius: 15 }}
        onClick={unlock}
      >
        {state.lockBusy ? 'Waiting for your device…' : 'Unlock with this device'}
      </PrimaryButton>
    </div>
  );
}
