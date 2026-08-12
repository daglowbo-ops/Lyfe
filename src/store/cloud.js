import { getSupabase, supabaseConfigured } from '../lib/supabase.js';

async function requireClient() {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  return getSupabase();
}

export async function getCloudSession() {
  if (!supabaseConfigured) return null;
  const client = await requireClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function onCloudAuthChange(callback) {
  if (!supabaseConfigured) return () => undefined;
  const client = await requireClient();
  const { data } = client.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => data.subscription.unsubscribe();
}

function credentials(email, password) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new Error('Enter a valid email address.');
  if (String(password || '').length < 6) throw new Error('Use at least 6 characters for your password.');
  return { email: normalized, password: String(password) };
}

export async function createCloudAccount(email, password) {
  const values = credentials(email, password);
  const client = await requireClient();
  const { data, error } = await client.auth.signUp(values);
  if (error) throw error;
  if (!data.session) throw new Error('Your account was created, but Supabase still requires email confirmation.');
  return { email: values.email, session: data.session };
}

export async function signInCloudAccount(email, password) {
  const values = credentials(email, password);
  const client = await requireClient();
  const { data, error } = await client.auth.signInWithPassword(values);
  if (error) throw error;
  if (!data.session) throw new Error('Fieldnote could not open your session. Try again.');
  return { email: values.email, session: data.session };
}

export async function requestCloudPasswordReset(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new Error('Enter a valid email address.');
  const client = await requireClient();
  const { error } = await client.auth.resetPasswordForEmail(normalized, {
    redirectTo: `${window.location.origin}/?recovery=1`,
  });
  if (error) throw error;
  return normalized;
}

export async function updateCloudPassword(password) {
  if (String(password || '').length < 6) throw new Error('Use at least 6 characters for your password.');
  const client = await requireClient();
  const { data, error } = await client.auth.updateUser({ password: String(password) });
  if (error) throw error;
  return data.user;
}

export async function changeCloudPassword(currentPassword, password) {
  if (!String(currentPassword || '').length) throw new Error('Enter your current password.');
  if (String(password || '').length < 6) throw new Error('Use at least 6 characters for your new password.');
  const client = await requireClient();
  const { data, error } = await client.auth.updateUser({
    password: String(password),
    current_password: String(currentPassword),
  });
  if (error) throw error;
  return data.user;
}

export async function signOutCloud() {
  const client = await requireClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function readCloudSnapshot(userId) {
  const client = await requireClient();
  const { data, error } = await client
    .from('fieldnote_snapshots')
    .select('payload, client_updated_at, updated_at, version')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function writeCloudSnapshot(payload, expectedVersion) {
  const client = await requireClient();
  const { data, error } = await client
    .rpc('save_fieldnote_snapshot', {
      p_payload: payload,
      p_schema_version: payload.schemaVersion,
      p_client_updated_at: payload.updatedAt,
      p_expected_version: expectedVersion,
    })
    .single();
  if (error) throw error;
  if (!data) throw new Error('The cloud save returned no record.');
  return data;
}
