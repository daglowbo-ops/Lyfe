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
  const { data } = client.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function requestCloudMagicLink(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new Error('Enter a valid email address.');
  const client = await requireClient();
  const { error } = await client.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
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
    .select('payload, client_updated_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function writeCloudSnapshot(userId, payload) {
  const client = await requireClient();
  const { error } = await client
    .from('fieldnote_snapshots')
    .upsert({
      user_id: userId,
      payload,
      schema_version: payload.schemaVersion,
      client_updated_at: payload.updatedAt,
    }, { onConflict: 'user_id' });
  if (error) throw error;
}
