// Both values are public client configuration. Keeping safe defaults prevents
// a Vercel rebuild without injected variables from disabling the whole app;
// deployment-specific environment variables can still override them.
const DEFAULT_URL = 'https://egveifuyajoogajfpeuu.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_6Enedx4lxM14UhhF3Wz27A_6TE55bHG';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || DEFAULT_PUBLISHABLE_KEY;

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
