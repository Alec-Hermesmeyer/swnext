import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

/**
 * Authenticated server client for API routes — reads the session from
 * HttpOnly cookies set by the Next.js middleware.
 *
 * Usage:
 *   import { createServerSupabase } from '@/lib/supabase';
 *   const supabase = createServerSupabase(req, res);
 *   const { data: { user } } = await supabase.auth.getUser();
 */
export function createServerSupabase(req, res) {
  return createPagesServerClient({ req, res });
}

/**
 * Admin client with the service-role key — bypasses RLS.
 * Only use in trusted server contexts (API routes), never client-side.
 */
export function createAdminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
