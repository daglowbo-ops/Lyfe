const CREDENTIAL_KEY = 'fieldnote.deviceCredential.v1';

const bytes = (length = 32) => crypto.getRandomValues(new Uint8Array(length));
const encode = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const decode = (value) => {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};

export const hasDeviceCredential = () => {
  try {
    return Boolean(localStorage.getItem(CREDENTIAL_KEY));
  } catch {
    return false;
  }
};

export async function deviceLockAvailable() {
  if (!window.isSecureContext || !window.PublicKeyCredential || !navigator.credentials) return false;
  if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return true;
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

export async function registerDeviceLock(name = 'Fieldnote user') {
  if (!(await deviceLockAvailable())) throw new Error('Device authentication is not available in this browser.');
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: bytes(),
      rp: { name: 'Fieldnote' },
      user: { id: bytes(16), name: 'fieldnote-local-user', displayName: name },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    },
  });
  if (!credential) throw new Error('Device authentication setup was cancelled.');
  localStorage.setItem(CREDENTIAL_KEY, encode(credential.rawId));
  return true;
}

export async function authenticateDeviceLock() {
  const id = localStorage.getItem(CREDENTIAL_KEY);
  if (!id) throw new Error('Set up device authentication from your profile first.');
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: bytes(),
      allowCredentials: [{ id: decode(id), type: 'public-key', transports: ['internal'] }],
      userVerification: 'required',
      timeout: 60000,
    },
  });
  if (!credential) throw new Error('Authentication was cancelled.');
  return true;
}

export function clearDeviceLock() {
  localStorage.removeItem(CREDENTIAL_KEY);
}
