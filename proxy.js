import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

/**
 * Next.js 16 proxy — runs on matched routes before rendering.
 * Auth session management is handled client-side via localStorage now,
 * so this proxy only handles edge-config and passes requests through.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

export async function proxy(req) {
  try {
    const { pathname } = req.nextUrl;

    if (pathname === '/welcome') {
      try {
        return NextResponse.json(await get('greeting'));
      } catch (e) {
        console.error('[proxy] edge-config get(greeting) failed:', e);
        return NextResponse.json({ error: 'Greeting unavailable' }, { status: 503 });
      }
    }

    return NextResponse.next({ request: req });
  } catch (err) {
    console.error('[proxy] unhandled error, passing request through:', err);
    return NextResponse.next({ request: req });
  }
}
