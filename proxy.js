import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

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

    const res = NextResponse.next({ request: req });

    // Refresh the Supabase session — getSession() validates the JWT and
    // writes updated HttpOnly cookies onto the response so tokens are
    // always fresh when the page or API handler executes.
    const supabase = createMiddlewareClient({ req, res });
    await supabase.auth.getSession();

    return res;
  } catch (err) {
    console.error('[proxy] unhandled error, passing request through:', err);
    return NextResponse.next({ request: req });
  }
}
