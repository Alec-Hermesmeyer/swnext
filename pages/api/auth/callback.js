import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  const { code, next } = req.query;

  if (!code) {
    return res.redirect('/login');
  }

  const supabase = createPagesServerClient({ req, res });
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error.message);
    return res.redirect('/login?error=callback_failed');
  }

  // Redirect to the originally requested page, or /admin by default.
  const target = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
    ? next
    : '/admin';
  res.redirect(target);
}
