import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Browser: standard createClient with localStorage (survives refresh reliably).
 * A simple sb-access-token cookie is synced by AuthContext for API route auth.
 * Server during SSR: ephemeral client (no persisted session on server bundle).
 */
const createSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    realtime: { enabled: true },
  });
};

const supabase = createSupabaseClient();

export default supabase;
