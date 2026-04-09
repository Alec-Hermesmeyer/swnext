import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import { createServerClient } from '@supabase/auth-helpers-nextjs';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Next.js 16 proxy — runs on matched routes before rendering.
 * Refreshes the Supabase session (sets HttpOnly cookies) and handles
 * edge-config lookups.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

export async function proxy(req) {
  try {
    const { pathname } = req.nextUrl;

    // Edge-config route — no session needed.
    if (pathname === '/welcome') {
      try {
        return NextResponse.json(await get('greeting'));
      } catch (e) {
        console.error('[proxy] edge-config get(greeting) failed:', e);
        return NextResponse.json({ error: 'Greeting unavailable' }, { status: 503 });
      }
    }

    let res = NextResponse.next({ request: req });

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res;
    }

    // Refresh the Supabase session and keep request/response cookies aligned
    // so downstream handlers can see the latest auth state immediately.
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });

          res = NextResponse.next({ request: req });

          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    });
    await supabase.auth.getUser();

    return res;
  } catch (err) {
    console.error('[proxy] unhandled error, passing request through:', err);
    return NextResponse.next({ request: req });
  }
}
