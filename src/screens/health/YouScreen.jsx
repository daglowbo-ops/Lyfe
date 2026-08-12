import { useState } from 'react';
import Screen from '../../components/Screen.jsx';
import { Avatar, GhostButton, Label, Mono, PrimaryButton } from '../../components/Primitives.jsx';
import { useApp } from '../../store/AppProvider.jsx';
import { goalOn } from '../../store/selectors.js';
import { key, shortLabel, parseKey, startOfToday } from '../../lib/date.js';
import { displayWeight, storedWeight, weightUnit } from '../../lib/format.js';
import { authenticateDeviceLock, clearDeviceLock, registerDeviceLock } from '../../lib/deviceLock.js';
import { MONO, NUT, ON_NUT, WARN, dim, input } from '../../lib/theme.js';

const SETTINGS = [
  ['haptics', 'Set vibration', 'A short cue when you complete a set'],
  ['kg', 'Use kilograms', 'Turn off to display pounds everywhere'],
];

export default function YouScreen() {
  const { state, sync, dispatch, resetAll, requestCloudLogin, disconnectCloud } = useApp();
  const useKg = state.toggles.kg;
  const unit = weightUnit(useKg);
  const latest = state.weights.at(-1)?.value || 0;
  const [weightDraft, setWeightDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const initials = state.profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'ME';

  const toggleDeviceLock = async () => {
    dispatch({ type: 'lockStatus', busy: true });
    try {
      if (state.toggles.lock) {
        await authenticateDeviceLock();
        clearDeviceLock();
        dispatch({ type: 'setDeviceLock', enabled: false });
      } else {
        await registerDeviceLock(state.profileName || 'Fieldnote user');
        dispatch({ type: 'setDeviceLock', enabled: true });
      }
    } catch (error) {
      dispatch({ type: 'lockStatus', busy: false, error: error?.message || 'Device authentication could not be completed.' });
      return;
    }
    dispatch({ type: 'lockStatus', busy: false });
  };

  const saveWeight = () => {
    const kg = storedWeight(weightDraft, useKg);
    if (!kg) return;
    dispatch({ type: 'addWeight', value: kg });
    setWeightDraft('');
  };

  return (
    <Screen>
      <button
        className="muted-link"
        onClick={() => dispatch({ type: 'screen', screen: 'today' })}
        style={{ display: 'inline-flex', alignItems: 'center', height: 44, paddingRight: 12, fontSize: 15, color: dim(0.5), marginBottom: 6 }}
      >
        ← Today
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar initials={initials} size={60} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            aria-label="Profile name"
            value={state.profileName}
            maxLength={80}
            onChange={(event) => dispatch({ type: 'setProfileName', value: event.target.value })}
            style={{ ...input, width: '100%', boxSizing: 'border-box', fontSize: 18, fontWeight: 600 }}
          />
          <div style={{ fontSize: 13, color: dim(0.48), marginTop: 6 }}>
            Private on this device · {displayWeight(latest, useKg)} {unit}
          </div>
        </div>
      </div>

      <Label style={{ marginTop: 26 }}>DAILY TARGETS</Label>
      <div style={{ marginTop: 10 }}>
        <GoalRow field="kcal" label="Calories" sub="per day" unit="kcal" />
        <GoalRow field="p" label="Protein" sub="grams per day" unit="g" />
        <div style={{ fontSize: 13, color: dim(0.48), marginTop: 12, lineHeight: 1.5 }}>
          Changes apply today and forward. Past days keep the targets they were measured against.
        </div>
      </div>

      <Label style={{ marginTop: 26 }}>BODY WEIGHT</Label>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          type="number"
          inputMode="decimal"
          aria-label={`Body weight in ${unit}`}
          placeholder={`${displayWeight(latest, useKg)} ${unit}`}
          value={weightDraft}
          onChange={(event) => setWeightDraft(event.target.value)}
          style={{ ...input, flex: 1, minWidth: 0, fontFamily: MONO, fontSize: 16 }}
        />
        <PrimaryButton
          background={NUT}
          color={ON_NUT}
          disabled={!storedWeight(weightDraft, useKg)}
          onClick={saveWeight}
          style={{ width: 116 }}
        >
          Log weight
        </PrimaryButton>
      </div>

      <Label style={{ marginTop: 26 }}>TARGET HISTORY</Label>
      <div style={{ marginTop: 10 }}>
        {goalBlocks(state).map((block) => (
          <div key={block.range} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderBottom: `1px solid ${dim(0.07)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: block.color, flexShrink: 0 }} />
              <Mono size={12.5} color={dim(0.6)}>{block.range}</Mono>
            </div>
            <Mono size={13} color={block.color} style={{ whiteSpace: 'nowrap' }}>{block.values}</Mono>
          </div>
        ))}
      </div>

      <Label style={{ marginTop: 26 }}>CLOUD SYNC</Label>
      <div style={{ marginTop: 10 }}>
        <StatusRow
          title={sync.signedIn ? 'Supabase connected' : 'Local-first storage'}
          sub={sync.signedIn
            ? `Signed in as ${sync.email}`
            : 'Your data stays on this device until you sign in'}
          value={syncLabel(sync)}
        />
        {sync.configured && !sync.signedIn && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              requestCloudLogin(emailDraft);
            }}
            style={{ display: 'flex', gap: 8, paddingTop: 12 }}
          >
            <input
              type="email"
              autoComplete="email"
              aria-label="Email for cloud sync"
              placeholder="you@example.com"
              value={emailDraft}
              onChange={(event) => setEmailDraft(event.target.value)}
              style={{ ...input, flex: 1, minWidth: 0, fontSize: 15 }}
            />
            <PrimaryButton
              type="submit"
              background={NUT}
              color={ON_NUT}
              disabled={sync.status === 'sending' || !emailDraft.trim()}
              style={{ width: 116 }}
            >
              {sync.status === 'sending' ? 'Sending…' : 'Sign in'}
            </PrimaryButton>
          </form>
        )}
        {sync.status === 'email-sent' && (
          <div role="status" style={{ color: NUT, fontSize: 13, lineHeight: 1.45, padding: '10px 0' }}>
            Check your inbox and open the secure sign-in link on this device.
          </div>
        )}
        {sync.error && (
          <div role="alert" style={{ color: WARN, fontSize: 13, lineHeight: 1.45, padding: '10px 0' }}>
            {sync.error}
          </div>
        )}
        {sync.signedIn && (
          <GhostButton style={{ width: '100%', marginTop: 12 }} onClick={disconnectCloud}>
            Sign out of cloud sync
          </GhostButton>
        )}
      </div>

      <Label style={{ marginTop: 26 }}>APP & PRIVACY</Label>
      <div style={{ marginTop: 10 }}>
        <StatusRow title="Offline ready" sub="The app and your records work without a connection" value="ON DEVICE" />
        {SETTINGS.map(([settingKey, label, sub]) => (
          <ToggleRow
            key={settingKey}
            label={label}
            sub={sub}
            checked={state.toggles[settingKey]}
            onClick={() => dispatch({ type: 'toggleSetting', key: settingKey })}
          />
        ))}
        <ToggleRow
          label="Device lock"
          sub="Use this device's fingerprint, face, or screen lock"
          checked={state.toggles.lock}
          disabled={state.lockBusy}
          onClick={toggleDeviceLock}
        />
        {state.lockError && (
          <div role="alert" style={{ color: WARN, fontSize: 13, lineHeight: 1.45, padding: '10px 0' }}>
            {state.lockError}
          </div>
        )}
      </div>

      <GhostButton
        style={{ width: '100%', marginTop: 26 }}
        onClick={() => {
          if (window.confirm('Delete meals, workouts, expenses, budgets, and targets from this device?')) resetAll();
        }}
      >
        Reset all data
      </GhostButton>
    </Screen>
  );
}

function GoalRow({ field, label, sub, unit }) {
  const { state, dispatch } = useApp();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderBottom: `1px solid ${dim(0.07)}` }}>
      <div>
        <label htmlFor={`goal-${field}`} style={{ fontSize: 15, fontWeight: 500 }}>{label}</label>
        <div style={{ fontSize: 12, color: dim(0.48), marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 48, padding: '0 12px', borderRadius: 13, border: `1px solid ${dim(0.14)}`, background: '#0D0D0C' }}>
        <input
          id={`goal-${field}`}
          type="number"
          inputMode="numeric"
          value={state.goals[field]}
          onChange={(event) => dispatch({ type: 'setGoal', field, value: event.target.value })}
          style={{ width: 76, height: 44, border: 'none', background: 'transparent', color: '#E9E5DC', textAlign: 'right', fontFamily: MONO, fontSize: 16, outline: 'none', padding: 0 }}
        />
        <Mono size={12} color={dim(0.45)}>{unit}</Mono>
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '15px 0', borderBottom: `1px solid ${dim(0.07)}`, opacity: disabled ? 0.55 : 1 }}
    >
      <div style={{ textAlign: 'left', minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: dim(0.48), marginTop: 2, lineHeight: 1.35 }}>{sub}</div>
      </div>
      <div style={{ width: 48, height: 28, borderRadius: 16, padding: 2, flexShrink: 0, transition: 'background .25s', background: checked ? NUT : dim(0.16) }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0D0D0C', transition: 'transform .25s cubic-bezier(.2,.8,.2,1)', transform: checked ? 'translateX(20px)' : 'none' }} />
      </div>
    </button>
  );
}

function StatusRow({ title, sub, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '15px 0', borderBottom: `1px solid ${dim(0.07)}` }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 12, color: dim(0.48), marginTop: 2 }}>{sub}</div>
      </div>
      <Label color={NUT}>{value}</Label>
    </div>
  );
}

function syncLabel(sync) {
  if (!sync.configured) return 'ON DEVICE';
  if (sync.status === 'checking') return 'CHECKING';
  if (sync.status === 'syncing') return 'SYNCING';
  if (sync.status === 'sending') return 'SENDING';
  if (sync.status === 'email-sent') return 'EMAIL SENT';
  if (sync.status === 'error') return 'RETRY';
  if (sync.signedIn) return 'SYNCED';
  return 'SIGN IN';
}

function goalBlocks(state) {
  const todayKey = key(startOfToday());
  const keys = Object.keys(state.goalHist).sort().filter((dateKey) => dateKey <= todayKey);
  const runs = [];
  let current = null;
  for (const dateKey of keys) {
    const value = goalOn(state, dateKey);
    if (!current || current.kcal !== value.kcal || current.p !== value.p) {
      current = { kcal: value.kcal, p: value.p, from: dateKey, to: dateKey };
      runs.push(current);
    } else current.to = dateKey;
  }
  return runs.slice(-4).reverse().map((block) => {
    const live = block.to >= todayKey;
    return {
      range: `${shortLabel(parseKey(block.from))} — ${live ? 'today' : shortLabel(parseKey(block.to))}`,
      values: `${block.kcal} kcal · ${block.p} g`,
      color: live ? NUT : dim(0.5),
    };
  });
}
