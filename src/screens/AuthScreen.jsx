import { useState } from 'react';
import PhoneShell from '../components/PhoneShell.jsx';
import { GhostButton, PrimaryButton } from '../components/Primitives.jsx';
import { dim, INK, input, MONO } from '../lib/theme.js';

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

function SignInView({ sync, onLogin }) {
  const [email, setEmail] = useState(sync.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const linkSent = sync.authStatus === 'link-sent' && !editingEmail;

  const sendLink = async (nextEmail) => {
    if (submitting) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onLogin(nextEmail);
      setEditingEmail(false);
    } catch (error) {
      setFormError(error?.message || 'The sign-in link could not be sent. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    void sendLink(email);
  };

  if (linkSent) {
    return (
      <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
        <h1 style={{ margin: 0, maxWidth: 320, fontSize: 36, lineHeight: 1.02, letterSpacing: -1.35 }}>
          Check your inbox
        </h1>
        <p role="status" aria-live="polite" style={{ margin: '15px 0 0', color: dim(0.65), fontSize: 15, lineHeight: 1.5 }}>
          We sent a secure sign-in link to <span style={{ color: INK }}>{sync.email}</span>. Open it in this browser to continue.
        </p>
        {formError && (
          <div role="alert" style={{ marginTop: 12, color: 'var(--warn)', fontSize: 13.5, lineHeight: 1.4 }}>
            {formError}
          </div>
        )}
        <GhostButton
          onClick={() => void sendLink(sync.email)}
          style={{ width: '100%', marginTop: 26 }}
        >
          {submitting ? 'Sending link…' : 'Send another link'}
        </GhostButton>
        <button
          className="muted-link"
          onClick={() => {
            setEmail('');
            setEditingEmail(true);
          }}
          style={{ width: '100%', minHeight: 44, marginTop: 8, textAlign: 'center', color: dim(0.62), fontSize: 14 }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
      <h1 style={{ margin: 0, maxWidth: 330, fontSize: 38, lineHeight: 1, letterSpacing: -1.5 }}>
        Your private record, online.
      </h1>
      <p style={{ margin: '16px 0 0', maxWidth: 330, color: dim(0.62), fontSize: 15, lineHeight: 1.5 }}>
        Sign in to open your health and money entries. Fieldnote keeps each account separate in Supabase.
      </p>

      <form onSubmit={submit} noValidate style={{ marginTop: 30 }}>
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
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-describedby={formError ? 'fieldnote-auth-error' : 'fieldnote-auth-help'}
          aria-invalid={Boolean(formError)}
          style={{ ...input, boxSizing: 'border-box', width: '100%', height: 52, marginTop: 9 }}
        />
        <div id="fieldnote-auth-help" style={{ marginTop: 9, color: dim(0.62), fontSize: 12.5, lineHeight: 1.4 }}>
          No password. We’ll email you a secure link.
        </div>
        {formError && (
          <div id="fieldnote-auth-error" role="alert" style={{ marginTop: 12, color: 'var(--warn)', fontSize: 13.5, lineHeight: 1.4 }}>
            {formError}
          </div>
        )}
        <PrimaryButton
          type="submit"
          background={INK}
          color="#0D0D0C"
          disabled={submitting || !email.trim()}
          style={{ marginTop: 20 }}
        >
          {submitting ? 'Sending link…' : 'Email me a sign-in link'}
        </PrimaryButton>
      </form>
    </div>
  );
}

export default function AuthScreen({ sync, onLogin, onRetry, onSignOut }) {
  const waiting = sync.status === 'checking' || sync.status === 'loading';
  const loadError = sync.status === 'error'
    && (sync.signedIn || !sync.configured || sync.authStatus === 'checking');

  return (
    <PhoneShell>
      <main
        style={{
          flex: 1,
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
          <SignInView sync={sync} onLogin={onLogin} />
        )}
        <p style={{ margin: 0, fontFamily: MONO, fontSize: 12, letterSpacing: 0.8, lineHeight: 1.5, color: dim(0.52) }}>
          PRIVATE BY ACCOUNT · HEALTH + MONEY
        </p>
      </main>
    </PhoneShell>
  );
}
