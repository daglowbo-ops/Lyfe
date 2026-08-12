import { useState } from 'react';
import Sheet from '../components/Sheet.jsx';
import { PrimaryButton } from '../components/Primitives.jsx';
import { INK, MONO, NUT, dim, input } from '../lib/theme.js';

function passwordError(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('current password') || message.includes('invalid login')) {
    return 'Your current password is incorrect.';
  }
  if (message.includes('same password') || message.includes('different from the old')) {
    return 'Choose a password you have not used for this account.';
  }
  if (message.includes('password')) return 'Use a password with at least 6 characters.';
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  return 'Your password could not be changed. Check your connection and try again.';
}

export default function PasswordSheet({ email, onChange, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changed, setChanged] = useState(false);
  const [formError, setFormError] = useState('');

  const clearError = () => setFormError('');

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!currentPassword) {
      setFormError('Enter your current password.');
      return;
    }
    if (password.length < 6) {
      setFormError('Use a password with at least 6 characters.');
      return;
    }
    if (password !== confirmation) {
      setFormError('The new passwords do not match.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await onChange(currentPassword, password);
      setChanged(true);
    } catch (error) {
      setFormError(passwordError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet title={changed ? 'Password changed' : 'Change password'} onClose={onClose} maxHeight="88%">
      {changed ? (
        <div className="screen-in" role="status" aria-live="polite" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 0 10px' }}>
          <div aria-hidden="true" style={{ width: 54, height: 54, borderRadius: '50%', display: 'grid', placeItems: 'center', background: NUT, color: '#0D0D0C', fontSize: 26, fontWeight: 700 }}>
            ✓
          </div>
          <h3 style={{ margin: '20px 0 0', fontSize: 25, lineHeight: 1.08, letterSpacing: -0.8 }}>
            Your account is secure.
          </h3>
          <p style={{ margin: '10px 0 0', maxWidth: 330, color: dim(0.62), fontSize: 14, lineHeight: 1.5 }}>
            Use your new password the next time you sign in as {email}.
          </p>
          <PrimaryButton background={INK} color="#0D0D0C" onClick={onClose} style={{ marginTop: 28 }}>
            Back to profile
          </PrimaryButton>
        </div>
      ) : (
        <form onSubmit={submit} noValidate style={{ minHeight: 0, overflowY: 'auto', padding: '18px 0 10px' }}>
          <p style={{ margin: '0 0 20px', color: dim(0.62), fontSize: 14, lineHeight: 1.5 }}>
            Confirm your current password, then choose a new one for {email}.
          </p>

          <PasswordInput
            id="account-current-password"
            label="CURRENT PASSWORD"
            value={currentPassword}
            onChange={(value) => { setCurrentPassword(value); clearError(); }}
            show={showPasswords}
            autoComplete="current-password"
            initialFocus
            invalid={Boolean(formError)}
          />
          <PasswordInput
            id="account-new-password"
            label="NEW PASSWORD"
            value={password}
            onChange={(value) => { setPassword(value); clearError(); }}
            show={showPasswords}
            autoComplete="new-password"
            help="At least 6 characters."
            invalid={Boolean(formError)}
          />
          <PasswordInput
            id="account-confirm-password"
            label="CONFIRM NEW PASSWORD"
            value={confirmation}
            onChange={(value) => { setConfirmation(value); clearError(); }}
            show={showPasswords}
            autoComplete="new-password"
            invalid={Boolean(formError)}
          />

          <button
            type="button"
            className="muted-link"
            onClick={() => setShowPasswords((value) => !value)}
            style={{ minHeight: 44, marginTop: 2, color: dim(0.65), fontSize: 13.5 }}
          >
            {showPasswords ? 'Hide passwords' : 'Show passwords'}
          </button>

          {formError && (
            <div id="account-password-error" role="alert" aria-live="polite" style={{ marginTop: 8, color: 'var(--warn)', fontSize: 13.5, lineHeight: 1.45 }}>
              {formError}
            </div>
          )}

          <PrimaryButton
            type="submit"
            background={INK}
            color="#0D0D0C"
            disabled={submitting || !currentPassword || password.length < 6 || confirmation.length < 6}
            style={{ marginTop: 18 }}
          >
            {submitting ? 'Changing password…' : 'Change password'}
          </PrimaryButton>
        </form>
      )}
    </Sheet>
  );
}

function PasswordInput({ id, label, value, onChange, show, autoComplete, help, initialFocus, invalid }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={{ display: 'block', fontFamily: MONO, fontSize: 11.5, letterSpacing: 1.25, color: dim(0.62) }}>
        {label}
      </label>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        minLength={autoComplete === 'new-password' ? 6 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={invalid ? 'account-password-error' : undefined}
        aria-invalid={invalid || undefined}
        data-sheet-initial-focus={initialFocus || undefined}
        style={{ ...input, boxSizing: 'border-box', width: '100%', height: 52, marginTop: 8 }}
      />
      {help && <div style={{ marginTop: 7, color: dim(0.55), fontSize: 12.5 }}>{help}</div>}
    </div>
  );
}
