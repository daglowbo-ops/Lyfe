import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { initialState, reducer } from './reducer.js';
import { clear, fingerprint, load, reconcile, save, snapshot } from './persistence.js';
import { seedState } from '../data/seed.js';
import { key, startOfToday } from '../lib/date.js';
import { rolloverData } from './model.js';
import { clearDeviceLock, hasDeviceCredential } from '../lib/deviceLock.js';
import { supabaseConfigured } from '../lib/supabase.js';
import {
  getCloudSession,
  onCloudAuthChange,
  readCloudSnapshot,
  requestCloudMagicLink,
  signOutCloud,
  writeCloudSnapshot,
} from './cloud.js';

const AppContext = createContext(null);

function prepareData(saved) {
  const today = startOfToday();
  const data = rolloverData(reconcile(saved, seedState(today), today), key(today));
  if (!hasDeviceCredential()) data.toggles.lock = false;
  return data;
}

const bootstrap = () => initialState(prepareData(load()));

const localSync = {
  configured: false,
  signedIn: false,
  status: 'local',
  email: '',
  lastSyncedAt: null,
  error: '',
};

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, bootstrap);
  const [sync, setSync] = useState(() => (
    supabaseConfigured ? { ...localSync, configured: true, status: 'checking' } : localSync
  ));
  const stateRef = useRef(state);
  const cloudUserRef = useRef(null);
  const cloudReadyRef = useRef(false);
  const syncTimerRef = useRef(null);
  const lastFingerprintRef = useRef(fingerprint(state));
  stateRef.current = state;

  // Only durable changes touch storage or the network. Navigation, open sheets,
  // lock state, and half-typed drafts remain transient UI.
  useEffect(() => {
    const nextFingerprint = fingerprint(state);
    if (nextFingerprint === lastFingerprintRef.current) return undefined;
    lastFingerprintRef.current = nextFingerprint;
    const payload = save(state);
    if (!cloudReadyRef.current || !cloudUserRef.current) return undefined;

    clearTimeout(syncTimerRef.current);
    setSync((current) => ({ ...current, status: 'syncing', error: '' }));
    syncTimerRef.current = setTimeout(async () => {
      try {
        await writeCloudSnapshot(cloudUserRef.current, payload);
        setSync((current) => ({ ...current, status: 'synced', lastSyncedAt: payload.updatedAt, error: '' }));
      } catch (error) {
        setSync((current) => ({ ...current, status: 'error', error: error?.message || 'Sync failed.' }));
      }
    }, 800);

    return () => clearTimeout(syncTimerRef.current);
  }, [state]);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    let active = true;

    const connect = async (session) => {
      if (!active) return;
      const user = session?.user;
      cloudReadyRef.current = false;
      cloudUserRef.current = user?.id || null;
      if (!user) {
        setSync({ ...localSync, configured: true, status: 'signed-out' });
        return;
      }

      setSync((current) => ({ ...current, configured: true, signedIn: true, status: 'syncing', email: user.email || '', error: '' }));
      try {
        const local = load();
        const remote = await readCloudSnapshot(user.id);
        if (!active) return;
        const localTime = Date.parse(local?.updatedAt || '') || 0;
        const remoteTime = Date.parse(remote?.client_updated_at || remote?.payload?.updatedAt || '') || 0;

        if (remote?.payload && remoteTime > localTime) {
          const data = prepareData(remote.payload);
          lastFingerprintRef.current = fingerprint(data);
          save(data);
          dispatch({ type: 'hydrate', data });
        } else {
          await writeCloudSnapshot(user.id, snapshot(stateRef.current));
        }

        if (!active) return;
        cloudReadyRef.current = true;
        setSync((current) => ({
          ...current,
          status: 'synced',
          email: user.email || '',
          lastSyncedAt: remoteTime > localTime ? remote.client_updated_at : new Date().toISOString(),
          error: '',
        }));
      } catch (error) {
        if (!active) return;
        setSync((current) => ({ ...current, status: 'error', error: error?.message || 'Cloud connection failed.' }));
      }
    };

    let stopAuthListener = () => undefined;
    onCloudAuthChange(connect).then((stop) => {
      if (active) stopAuthListener = stop;
      else stop();
    }).catch((error) => {
      if (active) setSync((current) => ({ ...current, status: 'error', error: error?.message || 'Cloud connection failed.' }));
    });
    getCloudSession().then(connect).catch((error) => {
      if (active) setSync((current) => ({ ...current, status: 'error', error: error?.message || 'Cloud connection failed.' }));
    });

    return () => {
      active = false;
      stopAuthListener();
      clearTimeout(syncTimerRef.current);
    };
  }, []);

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

  const value = useMemo(
    () => ({
      state,
      sync,
      dispatch,
      patch: (patch) => dispatch({ type: 'patch', patch }),
      requestCloudLogin: async (email) => {
        setSync((current) => ({ ...current, status: 'sending', error: '' }));
        try {
          await requestCloudMagicLink(email);
          setSync((current) => ({ ...current, status: 'email-sent', email: String(email).trim(), error: '' }));
        } catch (error) {
          setSync((current) => ({ ...current, status: 'error', error: error?.message || 'Could not send the sign-in link.' }));
        }
      },
      disconnectCloud: async () => {
        cloudReadyRef.current = false;
        try {
          await signOutCloud();
        } catch (error) {
          setSync((current) => ({ ...current, status: 'error', error: error?.message || 'Could not sign out.' }));
        }
      },
      resetAll: () => {
        clear();
        clearDeviceLock();
        dispatch({ type: 'reset' });
      },
    }),
    [state, sync],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
