import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { get } from '@vercel/edge-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const config = {
  matcher: ['/welcome', '/admin/:path*', '/login'],
};

const shouldRefreshSession = (pathname) =>
  pathname.startsWith('/admin') || pathname === '/login';

/**
 * Next.js 16+: use `proxy.js` + `export function proxy` (middleware.ts is deprecated).
 * Supabase cookie-based SSR requires this to refresh tokens; setAll must update both
 * request and response cookies so refreshed Set-Cookie headers stay consistent.
 */
export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isWelcome = pathname === '/welcome';

  const response = isWelcome
    ? NextResponse.json(await get('greeting'))
    : NextResponse.next({ request: req });

  if (shouldRefreshSession(pathname) && SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.getUser();
  }

  return response;
}
