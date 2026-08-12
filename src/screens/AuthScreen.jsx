import { useState } from 'react';
import PhoneShell from '../components/PhoneShell.jsx';
import {
  GhostButton,
  PrimaryButton,
  SegmentedControl,
} from '../components/Primitives.jsx';
import { dim, INK, input, MONO } from '../lib/theme.js';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const copyByStatus = {
  checking: {
    title: 'Opening Fieldnote',
    body: 'Checking your secure session…',
  },
  loading: {
    title: 'Loading your record',
    body: 'Fetching your private health and money entries…',
  },
};

function BrandMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }} aria-label="Fieldnote">
      <div aria-hidden="true" style={{ display: 'flex', gap: 3 }}>
        <span style={{ width: 4, height: 22, borderRadius: 3, background: 'var(--nut)' }} />
        <span style={{ width: 4, height: 22, borderRadius: 3, background: 'var(--trn)' }} />
        <span style={{ width: 4, height: 22, borderRadius: 3, background: 'var(--mny)' }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 1.8 }}>FIELDNOTE</span>
    </div>
  );
}

function StatusView({ status, error, configured, onRetry, onSignOut }) {
  if (status !== 'error') {
    const copy = copyByStatus[status] || copyByStatus.checking;
    return (
      <div role="status" aria-live="polite" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
        <h1 style={{ margin: 0, maxWidth: 300, fontSize: 34, lineHeight: 1.04, letterSpacing: -1.2 }}>
          {copy.title}
        </h1>
        <p style={{ margin: '14px 0 0', color: dim(0.6), fontSize: 15, lineHeight: 1.5 }}>
          {copy.body}
        </p>
        <div aria-hidden="true" style={{ display: 'flex', gap: 6, marginTop: 24 }}>
          {[0.35, 0.65, 1].map((opacity) => (
            <span key={opacity} style={{ width: 28, height: 2, borderRadius: 2, background: dim(opacity) }} />
          ))}
        </div>
      </div>
    );
  }

  const configurationError = !configured;
  return (
    <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
      <h1 style={{ margin: 0, maxWidth: 315, fontSize: 34, lineHeight: 1.04, letterSpacing: -1.2 }}>
        {configurationError ? 'Fieldnote needs a database' : 'Your record could not load'}
      </h1>
      <p role="alert" style={{ margin: '14px 0 0', color: dim(0.68), fontSize: 15, lineHeight: 1.5 }}>
        {configurationError
          ? 'The Supabase connection is missing. Add the project URL and publishable key, then reload the app.'
          : error || 'Check your connection and try loading your record again.'}
      </p>
      <PrimaryButton
        background={INK}
        color="#0D0D0C"
        onClick={configurationError ? () => window.location.reload() : onRetry}
        style={{ marginTop: 26 }}
      >
        {configurationError ? 'Reload configuration' : 'Try again'}
      </PrimaryButton>
      {!configurationError && onSignOut && (
        <GhostButton onClick={() => void onSignOut().catch(() => undefined)} style={{ width: '100%', marginTop: 10 }}>
          Sign out
        </GhostButton>
      )}
    </div>
  );
}

function friendlyAuthError(error, mode) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'An account already exists for this email. Choose Sign in instead.';
  }
  if (message.includes('password')) return 'Use a password with at least 6 characters.';
  if (message.includes('rate limit') || message.includes('too many')) return 'Too many attempts. Wait a moment and try again.';
  if (message.includes('confirmation')) return 'This account still needs confirmation. Please try again in a moment.';
  return mode === 'create'
    ? 'We could not create your account. Check your connection and try again.'
    : 'We could not sign you in. Check your details and try again.';
}

function AccountView({ sync, onAuthenticate }) {
  const [mode, setMode] = useState('create');
  const [email, setEmail] = useState(sync.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const creating = mode === 'create';
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const passwordValid = password.length >= 6;

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setFormError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!emailValid) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (!passwordValid) {
      setFormError('Use a password with at least 6 characters.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await onAuthenticate(mode, email, password);
    } catch (error) {
      setFormError(friendlyAuthError(error, mode));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen-in" style={{ marginTop: 'clamp(38px, 9vh, 72px)', marginBottom: 32 }}>
      <SegmentedControl
        ariaLabel="Account access"
        value={mode}
        onChange={changeMode}
        options={[
          { value: 'create', label: 'Create account' },
          { value: 'sign-in', label: 'Sign in' },
        ]}
      />

      <h1 style={{ margin: '28px 0 0', maxWidth: 330, fontSize: 38, lineHeight: 1, letterSpacing: -1.5 }}>
        {creating ? 'Create your account.' : 'Welcome back.'}
      </h1>
      <p style={{ margin: '14px 0 0', maxWidth: 340, color: dim(0.64), fontSize: 15, lineHeight: 1.5 }}>
        {creating
          ? 'Use your email and a password. Your private record opens immediately—no confirmation email.'
          : 'Enter the email and password you used when creating your account.'}
      </p>

      <form onSubmit={submit} noValidate style={{ marginTop: 26 }}>
        <label htmlFor="fieldnote-email" style={{ display: 'block', fontFamily: MONO, fontSize: 12, letterSpacing: 1.35, color: dim(0.62) }}>
          EMAIL ADDRESS
        </label>
        <input
          id="fieldnote-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck="false"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFormError('');
          }}
          placeholder="you@example.com"
          aria-describedby={formError ? 'fieldnote-auth-error' : undefined}
          aria-invalid={Boolean(formError)}
          style={{ ...input, boxSizing: 'border-box', width: '100%', height: 52, marginTop: 9 }}
        />

        <label htmlFor="fieldnote-password" style={{ display: 'block', marginTop: 18, fontFamily: MONO, fontSize: 12, letterSpacing: 1.35, color: dim(0.62) }}>
          PASSWORD
        </label>
        <div style={{ position: 'relative', marginTop: 9 }}>
          <input
            id="fieldnote-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={creating ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFormError('');
            }}
            aria-describedby={formError ? 'fieldnote-auth-error' : 'fieldnote-password-help'}
            aria-invalid={Boolean(formError)}
            style={{ ...input, boxSizing: 'border-box', width: '100%', height: 52, paddingRight: 78 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{ position: 'absolute', top: 4, right: 5, minWidth: 66, height: 44, textAlign: 'center', color: dim(0.68), fontSize: 13, fontWeight: 600 }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <div id="fieldnote-password-help" style={{ marginTop: 9, color: dim(0.56), fontSize: 12.5, lineHeight: 1.4 }}>
          {creating ? 'At least 6 characters.' : 'Your Fieldnote account password.'}
        </div>

        {formError && (
          <div id="fieldnote-auth-error" role="alert" aria-live="polite" style={{ marginTop: 12, color: 'var(--warn)', fontSize: 13.5, lineHeight: 1.4 }}>
            {formError}
          </div>
        )}

        <PrimaryButton
          type="submit"
          background={INK}
          color="#0D0D0C"
          disabled={submitting || !emailValid || !passwordValid}
          style={{ marginTop: 20 }}
        >
          {submitting
            ? (creating ? 'Creating account…' : 'Signing in…')
            : (creating ? 'Create account' : 'Sign in')}
        </PrimaryButton>
      </form>
    </div>
  );
}

export default function AuthScreen({ sync, onAuthenticate, onRetry, onSignOut }) {
  const waiting = sync.status === 'checking' || sync.status === 'loading';
  const loadError = sync.status === 'error'
    && (sync.signedIn || !sync.configured || sync.authStatus === 'checking');

  return (
    <PhoneShell>
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: 'calc(env(safe-area-inset-top, 0px) + 28px) 24px calc(env(safe-area-inset-bottom, 0px) + 30px)',
          boxSizing: 'border-box',
        }}
      >
        <BrandMark />
        {waiting || loadError ? (
          <StatusView
            status={sync.status}
            error={sync.error}
            configured={sync.configured}
            onRetry={onRetry}
            onSignOut={sync.signedIn ? onSignOut : undefined}
          />
        ) : (
          <AccountView sync={sync} onAuthenticate={onAuthenticate} />
        )}
        <p style={{ margin: 'auto 0 0', fontFamily: MONO, fontSize: 12, letterSpacing: 0.8, lineHeight: 1.5, color: dim(0.52) }}>
          PRIVATE BY ACCOUNT · HEALTH + MONEY
        </p>
      </main>
    </PhoneShell>
  );
}
