import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Browser: cookie-based session via createBrowserClient (required for SSR + proxy refresh).
 * Do not override auth.* here — that can break the package's storage wiring.
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

  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY, {
    realtime: { enabled: true },
  });
};

const supabase = createSupabaseClient();

export default supabase;
