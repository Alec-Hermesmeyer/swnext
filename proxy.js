import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { get } from '@vercel/edge-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Run session refresh on every document navigation so auth cookies stay valid.
 * Exclude static assets and Next internals (same pattern as Supabase SSR docs).
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

export async function proxy(req) {
  try {
    return await runProxy(req);
  } catch (err) {
    console.error('[proxy] unhandled error, passing request through:', err);
    return NextResponse.next({ request: req });
  }
}

async function runProxy(req) {
  const { pathname } = req.nextUrl;

  if (pathname === '/welcome') {
    try {
      return NextResponse.json(await get('greeting'));
    } catch (e) {
      console.error('[proxy] edge-config get(greeting) failed:', e);
      return NextResponse.json({ error: 'Greeting unavailable' }, { status: 503 });
    }
  }

  let response = NextResponse.next({ request: req });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      /**
       * Only mutate the *response* cookies. In Next.js, `request.cookies.set`
       * can throw ReadonlyRequestCookiesError in edge/proxy — that breaks
       * every auth refresh and makes login/refresh fail in production.
       */
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
