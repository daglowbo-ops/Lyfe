import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import AuthScreen from '../screens/AuthScreen.jsx';
import { initialState, reducer } from './reducer.js';
import { fingerprint, reconcile, snapshot } from './persistence.js';
import { newAccountState } from '../data/seed.js';
import { key, startOfToday } from '../lib/date.js';
import { rolloverData } from './model.js';
import { clearDeviceLock, hasDeviceCredential } from '../lib/deviceLock.js';
import { supabaseConfigured } from '../lib/supabase.js';
import {
  createCloudAccount,
  getCloudSession,
  onCloudAuthChange,
  readCloudSnapshot,
  requestCloudPasswordReset,
  signInCloudAccount,
  signOutCloud,
  updateCloudPassword,
  writeCloudSnapshot,
} from './cloud.js';

const AppContext = createContext(null);

function prepareData(saved) {
  const today = startOfToday();
  const data = rolloverData(reconcile(saved, newAccountState(today), today), key(today));
  if (!hasDeviceCredential()) data.toggles.lock = false;
  return data;
}

function prepareNewAccount(profileName = 'Your name') {
  const today = startOfToday();
  const data = rolloverData(newAccountState(today, profileName), key(today));
  if (!hasDeviceCredential()) data.toggles.lock = false;
  return data;
}

const bootstrap = () => initialState(prepareNewAccount());

const initialSync = supabaseConfigured
  ? {
      configured: true,
      signedIn: false,
      dataReady: false,
      authStatus: 'checking',
      status: 'checking',
      email: '',
      lastSyncedAt: null,
      error: '',
      errorSource: '',
    }
  : {
      configured: false,
      signedIn: false,
      dataReady: false,
      authStatus: 'signed-out',
      status: 'error',
      email: '',
      lastSyncedAt: null,
      error: 'Supabase is not configured.',
      errorSource: 'config',
    };

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, bootstrap);
  const [sync, setSync] = useState(initialSync);
  const stateRef = useRef(state);
  const mountedRef = useRef(true);
  const sessionRef = useRef(null);
  const cloudUserRef = useRef(null);
  const cloudReadyRef = useRef(false);
  const cloudVersionRef = useRef(0);
  const loadingUserRef = useRef(null);
  const passwordRecoveryRef = useRef(false);
  const loadAttemptRef = useRef(0);
  const syncTimerRef = useRef(null);
  const lastSavedFingerprintRef = useRef(fingerprint(state));
  const savePromiseRef = useRef(null);
  const saveQueuedRef = useRef(false);
  stateRef.current = state;

  const persistLatest = useCallback(async ({ force = false } = {}) => {
    if (!cloudReadyRef.current || !cloudUserRef.current) return false;

    if (savePromiseRef.current) {
      saveQueuedRef.current = true;
      return savePromiseRef.current;
    }

    const run = async () => {
      let mustWrite = force;
      do {
        saveQueuedRef.current = false;
        const userId = cloudUserRef.current;
        if (!cloudReadyRef.current || !userId) return false;

        const current = stateRef.current;
        const nextFingerprint = fingerprint(current);
        if (!mustWrite && nextFingerprint === lastSavedFingerprintRef.current) break;

        if (mountedRef.current) {
          setSync((value) => ({ ...value, status: 'saving', error: '', errorSource: '' }));
        }

        const payload = snapshot(current);
        let saved;
        try {
          saved = await writeCloudSnapshot(payload, cloudVersionRef.current);
        } catch (error) {
          const conflict = error?.code === '40001' || error?.code === '23505';
          if (mountedRef.current && userId === cloudUserRef.current) {
            setSync((value) => ({
              ...value,
              status: 'error',
              error: conflict
                ? 'This record changed in another session. Reload the latest version before continuing.'
                : error?.message || 'Your changes could not be saved. Try again.',
              errorSource: conflict ? 'conflict' : 'save',
            }));
          }
          return false;
        }

        if (userId !== cloudUserRef.current) return false;
        cloudVersionRef.current = Number(saved?.version) || cloudVersionRef.current + 1;
        lastSavedFingerprintRef.current = nextFingerprint;
        mustWrite = false;

        if (mountedRef.current) {
          const hasNewerChanges = fingerprint(stateRef.current) !== lastSavedFingerprintRef.current;
          setSync((value) => ({
            ...value,
            status: hasNewerChanges ? 'saving' : 'saved',
            lastSyncedAt: saved?.updated_at || payload.updatedAt,
            error: '',
            errorSource: '',
          }));
        }
      } while (
        saveQueuedRef.current
        || fingerprint(stateRef.current) !== lastSavedFingerprintRef.current
      );
      return true;
    };

    const promise = run().finally(() => {
      if (savePromiseRef.current === promise) savePromiseRef.current = null;
    });
    savePromiseRef.current = promise;
    return promise;
  }, []);

  const loadSession = useCallback(async (session, { force = false } = {}) => {
    sessionRef.current = session || null;
    const user = session?.user;

    if (!user) {
      loadAttemptRef.current += 1;
      loadingUserRef.current = null;
      cloudReadyRef.current = false;
      cloudUserRef.current = null;
      cloudVersionRef.current = 0;
      clearTimeout(syncTimerRef.current);
      const empty = prepareNewAccount();
      lastSavedFingerprintRef.current = fingerprint(empty);
      dispatch({ type: 'hydrate', data: empty });
      if (mountedRef.current) {
        setSync({
          configured: true,
          signedIn: false,
          dataReady: false,
          authStatus: 'signed-out',
          status: 'saved',
          email: '',
          lastSyncedAt: null,
          error: '',
          errorSource: '',
        });
      }
      return true;
    }

    if (!force && user.id === loadingUserRef.current) return false;
    if (!force && user.id === cloudUserRef.current && cloudReadyRef.current) {
      if (mountedRef.current) {
        setSync((value) => ({ ...value, email: user.email || value.email }));
      }
      return true;
    }

    const attempt = ++loadAttemptRef.current;
    loadingUserRef.current = user.id;
    cloudReadyRef.current = false;
    cloudUserRef.current = user.id;
    clearTimeout(syncTimerRef.current);
    if (mountedRef.current) {
      setSync((value) => ({
        ...value,
        configured: true,
        signedIn: true,
        dataReady: false,
        authStatus: 'signed-in',
        status: 'loading',
        email: user.email || '',
        error: '',
        errorSource: '',
      }));
    }

    try {
      const remote = await readCloudSnapshot(user.id);
      if (attempt !== loadAttemptRef.current || user.id !== cloudUserRef.current) return false;

      const data = remote?.payload
        ? prepareData(remote.payload)
        : prepareNewAccount(user.user_metadata?.full_name || 'Your name');
      let lastSyncedAt = remote?.updated_at || remote?.client_updated_at || null;
      cloudVersionRef.current = Number(remote?.version) || 0;
      if (!remote?.payload) {
        const payload = snapshot(data);
        const created = await writeCloudSnapshot(payload, 0);
        if (attempt !== loadAttemptRef.current || user.id !== cloudUserRef.current) return false;
        lastSyncedAt = created?.updated_at || payload.updatedAt;
        cloudVersionRef.current = Number(created?.version) || 1;
      }

      lastSavedFingerprintRef.current = fingerprint(data);
      dispatch({ type: 'hydrate', data });
      cloudReadyRef.current = true;
      loadingUserRef.current = null;
      if (mountedRef.current) {
        setSync({
          configured: true,
          signedIn: true,
          dataReady: true,
          authStatus: 'signed-in',
          status: 'saved',
          email: user.email || '',
          lastSyncedAt,
          error: '',
          errorSource: '',
        });
      }
      return true;
    } catch (error) {
      if (attempt !== loadAttemptRef.current || user.id !== cloudUserRef.current) return false;
      loadingUserRef.current = null;
      cloudReadyRef.current = false;
      if (mountedRef.current) {
        setSync((value) => ({
          ...value,
          configured: true,
          signedIn: true,
          dataReady: false,
          authStatus: 'signed-in',
          status: 'error',
          email: user.email || '',
          error: error?.message || 'Your private record could not be loaded. Try again.',
          errorSource: 'load',
        }));
      }
      return false;
    }
  }, []);

  useEffect(() => {
    if (!cloudReadyRef.current || !cloudUserRef.current) return undefined;
    const nextFingerprint = fingerprint(state);
    if (nextFingerprint === lastSavedFingerprintRef.current) return undefined;

    clearTimeout(syncTimerRef.current);
    setSync((value) => ({ ...value, status: 'saving', error: '', errorSource: '' }));
    syncTimerRef.current = setTimeout(() => {
      void persistLatest();
    }, 650);

    return () => clearTimeout(syncTimerRef.current);
  }, [persistLatest, state]);

  useEffect(() => {
    mountedRef.current = true;
    if (!supabaseConfigured) return () => {
      mountedRef.current = false;
    };

    let active = true;
    let stopAuthListener = () => undefined;

    const receiveSession = (event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        passwordRecoveryRef.current = true;
        sessionRef.current = session;
        cloudReadyRef.current = false;
        cloudUserRef.current = null;
        if (mountedRef.current) {
          setSync({
            configured: true,
            signedIn: true,
            dataReady: false,
            authStatus: 'password-recovery',
            status: 'saved',
            email: session.user.email || '',
            lastSyncedAt: null,
            error: '',
            errorSource: '',
          });
        }
        return;
      }
      if (passwordRecoveryRef.current && session?.user) {
        sessionRef.current = session;
        return;
      }
      if (
        (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')
        && session?.user?.id === cloudUserRef.current
      ) {
        sessionRef.current = session;
        if (mountedRef.current) {
          setSync((value) => ({ ...value, email: session.user.email || value.email }));
        }
        return;
      }
      queueMicrotask(() => {
        if (active) void loadSession(session);
      });
    };

    const initialize = async () => {
      try {
        const stop = await onCloudAuthChange(receiveSession);
        if (!active) {
          stop();
          return;
        }
        stopAuthListener = stop;
        const session = await getCloudSession();
        if (active && !passwordRecoveryRef.current) await loadSession(session);
      } catch (error) {
        if (!active || !mountedRef.current) return;
        setSync((value) => ({
          ...value,
          status: 'error',
          error: error?.message || 'Fieldnote could not check your session. Try again.',
          errorSource: 'auth',
        }));
      }
    };

    void initialize();
    return () => {
      active = false;
      mountedRef.current = false;
      loadAttemptRef.current += 1;
      cloudReadyRef.current = false;
      clearTimeout(syncTimerRef.current);
      stopAuthListener();
    };
  }, [loadSession]);

  // One rest clock for the whole app; the reducer ignores ticks when idle.
  useEffect(() => {
    if (!state.resting) return undefined;
    const id = setInterval(() => dispatch({ type: 'restTick' }), 1000);
    return () => clearInterval(id);
  }, [state.resting]);

  // Keep an app left open overnight aligned with the device's local date.
  useEffect(() => {
    const checkDate = () => dispatch({ type: 'rollover', date: key(startOfToday()) });
    const id = setInterval(checkDate, 60000);
    document.addEventListener('visibilitychange', checkDate);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', checkDate);
    };
  }, []);

  const authenticateWithPassword = useCallback(async (mode, email, password) => {
    try {
      const result = mode === 'create'
        ? await createCloudAccount(email, password)
        : await signInCloudAccount(email, password);
      await loadSession(result.session);
      return result.email;
    } catch (error) {
      if (mountedRef.current) {
        setSync((value) => ({
          ...value,
          authStatus: 'signed-out',
          status: 'saved',
          error: '',
          errorSource: '',
        }));
      }
      throw error;
    }
  }, [loadSession]);

  const sendPasswordReset = useCallback(async (email) => requestCloudPasswordReset(email), []);

  const finishPasswordRecovery = useCallback(async (password) => {
    await updateCloudPassword(password);
    passwordRecoveryRef.current = false;
    const session = sessionRef.current || await getCloudSession();
    if (!session?.user) throw new Error('Your recovery session expired. Request a new password link.');
    await loadSession(session, { force: true });
    return session.user.email || '';
  }, [loadSession]);

  const disconnectCloud = useCallback(async () => {
    clearTimeout(syncTimerRef.current);
    if (cloudReadyRef.current && fingerprint(stateRef.current) !== lastSavedFingerprintRef.current) {
      const saved = await persistLatest();
      if (!saved) throw new Error('Your latest changes must be saved before signing out.');
    }
    cloudReadyRef.current = false;
    if (mountedRef.current) {
      setSync((value) => ({ ...value, status: 'checking', dataReady: false, error: '', errorSource: '' }));
    }
    try {
      await signOutCloud();
      await loadSession(null, { force: true });
    } catch (error) {
      if (mountedRef.current) {
        setSync((value) => ({
          ...value,
          status: 'error',
          error: error?.message || 'Could not sign out. Try again.',
          errorSource: 'auth',
        }));
      }
      throw error;
    }
  }, [loadSession, persistLatest]);

  const retrySync = useCallback(async () => {
    if (sync.errorSource === 'save' && cloudReadyRef.current) {
      return persistLatest({ force: true });
    }
    if (sync.errorSource === 'conflict' && sessionRef.current?.user) {
      return loadSession(sessionRef.current, { force: true });
    }
    if (sessionRef.current?.user) {
      return loadSession(sessionRef.current, { force: true });
    }
    if (sync.errorSource === 'auth') {
      if (mountedRef.current) {
        setSync((value) => ({ ...value, status: 'checking', error: '', errorSource: '' }));
      }
      try {
        const session = await getCloudSession();
        return loadSession(session, { force: true });
      } catch (error) {
        if (mountedRef.current) {
          setSync((value) => ({
            ...value,
            status: 'error',
            error: error?.message || 'Fieldnote could not check your session. Try again.',
            errorSource: 'auth',
          }));
        }
        return false;
      }
    }
    return false;
  }, [loadSession, persistLatest, sync.errorSource]);

  const value = useMemo(
    () => ({
      state,
      sync,
      dispatch,
      patch: (patch) => dispatch({ type: 'patch', patch }),
      authenticateWithPassword,
      sendPasswordReset,
      finishPasswordRecovery,
      retrySync,
      disconnectCloud,
      signOut: disconnectCloud,
      resetAll: () => {
        clearDeviceLock();
        dispatch({ type: 'hydrate', data: prepareNewAccount() });
      },
    }),
    [authenticateWithPassword, disconnectCloud, finishPasswordRecovery, retrySync, sendPasswordReset, state, sync],
  );

  const appReady = sync.signedIn && sync.dataReady;
  return (
    <AppContext.Provider value={value}>
      {appReady ? children : (
        <AuthScreen
          sync={sync}
          onAuthenticate={authenticateWithPassword}
          onRequestPasswordReset={sendPasswordReset}
          onFinishPasswordRecovery={finishPasswordRecovery}
          onRetry={retrySync}
          onSignOut={disconnectCloud}
        />
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
