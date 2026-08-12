const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigured = Boolean(url && publishableKey);
let clientPromise;

export function getSupabase() {
  if (!supabaseConfigured) return Promise.reject(new Error('Supabase is not configured.'));
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'fieldnote.auth',
      },
    }));
  }
  return clientPromise;
}
