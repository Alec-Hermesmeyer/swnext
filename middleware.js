import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh the session — sets updated HttpOnly cookies on the response
  // automatically. This runs before every matched route so tokens are
  // always fresh when the page or API handler executes.
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/api/:path*'],
};
