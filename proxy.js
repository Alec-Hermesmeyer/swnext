import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { get } from '@vercel/edge-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const COOKIE_NAME = 'sw-admin-auth';

export const config = {
  matcher: ['/welcome', '/admin/:path*', '/login'],
};

const shouldRefreshSession = (pathname) =>
  pathname.startsWith('/admin') || pathname === '/login';

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isWelcome = pathname === '/welcome';

  const response = isWelcome
    ? NextResponse.json(await get('greeting'))
    : NextResponse.next();

  if (shouldRefreshSession(pathname) && SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookieOptions: { name: COOKIE_NAME },
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.getSession();
  }

  return response;
}
