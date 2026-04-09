import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getRequestCookies = (req) => {
  if (req?.cookies && typeof req.cookies.getAll === 'function') {
    return req.cookies.getAll();
  }

  if (req?.cookies && typeof req.cookies === 'object') {
    return Object.entries(req.cookies).map(([name, value]) => ({ name, value }));
  }

  const rawCookie = req?.headers?.cookie || '';
  return rawCookie
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) {
        return { name: part, value: '' };
      }

      return {
        name: decodeURIComponent(part.slice(0, separatorIndex)),
        value: decodeURIComponent(part.slice(separatorIndex + 1)),
      };
    });
};

const serializeCookie = (name, value, options = {}) => {
  const enc = encodeURIComponent;
  const parts = [`${enc(name)}=${enc(value ?? '')}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) {
    const sameSite = String(options.sameSite).toLowerCase();
    if (sameSite === 'lax') parts.push('SameSite=Lax');
    else if (sameSite === 'strict') parts.push('SameSite=Strict');
    else if (sameSite === 'none') parts.push('SameSite=None');
  }
  return parts.join('; ');
};

const appendResponseCookie = (res, name, value, options) => {
  if (!res || typeof res.getHeader !== 'function' || typeof res.setHeader !== 'function') {
    return;
  }

  const serialized = serializeCookie(name, value, options);
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', serialized);
    return;
  }

  const list = Array.isArray(existing) ? existing : [String(existing)];
  res.setHeader('Set-Cookie', [...list, serialized]);
};

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
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    cookies: {
      getAll() {
        return getRequestCookies(req);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          appendResponseCookie(res, name, value, options);
        });
      },
    },
  });
}

/**
 * Admin client with the service-role key — bypasses RLS.
 * Only use in trusted server contexts (API routes), never client-side.
 */
export function createAdminSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
