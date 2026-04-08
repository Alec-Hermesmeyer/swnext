// AuthContext.js
import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/components/Supabase';
import { getPermissions } from '@/lib/roles';

const AuthContext = createContext();

/** Sync access token to a cookie so legacy API routes can read it.
 *  The proxy (proxy.js) now sets proper HttpOnly session cookies — new API
 *  routes should use createServerSupabase() from lib/supabase.js instead. */
function syncTokenCookie(session) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  if (session?.access_token) {
    document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax${secure}`;
  } else {
    document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax${secure}`;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [accessLevel, setAccessLevel] = useState(3);
  const [department, setDepartment] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  });

  const fetchUserProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, department, full_name, username, access_level')
      .eq('id', userId)
      .single();

    // PGRST116 = "no rows returned" — the profile row genuinely doesn't
    // exist yet (e.g. new user before the insert trigger runs).
    if (error && error.code !== 'PGRST116') {
      console.error('Profile fetch error:', error);
      throw error;
    }

    return data || null;
  }, []);

  const applyProfile = useCallback((nextProfile) => {
    setProfile(nextProfile);
    setRole(nextProfile ? nextProfile.role || 'user' : null);
    setAccessLevel(nextProfile?.access_level || 3);
    setDepartment(nextProfile?.department || null);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authResolved = false;
    // Gate: onAuthStateChange must not process events (except SIGNED_OUT)
    // until recoverSession() completes.  Without this, getUser() can
    // internally refresh an expired token, which fires TOKEN_REFRESHED
    // on the listener while recoverSession is still mid-flight — causing
    // two concurrent fetchUserProfile calls and interleaved state updates
    // that leave the page in a half-authed / hanging state.
    let recoveryDone = false;

    const finishLoading = () => {
      authResolved = true;
      if (isMounted) setLoading(false);
    };

    const clearAuthState = () => {
      setUser(null);
      applyProfile(null);
      syncTokenCookie(null);
    };

    // Validate the JWT with the Supabase server first — getUser() checks
    // the token and triggers a refresh when it has expired, preventing the
    // flash of stale auth state that getSession() (localStorage-only) causes.
    // Profile is fetched BEFORE finishLoading so role/department/profile are
    // available when the page renders.
    // Fetch profile with a single retry. On permanent failure, return null
    // so the caller can apply a safe fallback instead of clearing auth state.
    const fetchProfileWithRetry = async (userId) => {
      try {
        return await fetchUserProfile(userId);
      } catch (err) {
        console.warn('Profile fetch failed, retrying once…', err.message);
        try {
          return await fetchUserProfile(userId);
        } catch (retryErr) {
          console.error('Profile fetch failed after retry:', retryErr);
          return null;
        }
      }
    };

    // When the profile DB query fails but the user JWT is valid, apply
    // minimum-privilege defaults so the user stays authenticated rather
    // than being kicked to the login page.
    const FALLBACK_PROFILE = { role: 'user', access_level: 3, department: null, full_name: null, username: null };

    const recoverSession = async () => {
      try {
        const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (validatedUser && !userError) {
          setUser(validatedUser);
          const { data: { session } } = await supabase.auth.getSession();
          syncTokenCookie(session);
          const userProfile = await fetchProfileWithRetry(validatedUser.id);
          if (isMounted) applyProfile(userProfile || FALLBACK_PROFILE);
          return;
        }

        // Server validation failed — fall back to local session (offline)
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          syncTokenCookie(session);
          const userProfile = await fetchProfileWithRetry(session.user.id);
          if (isMounted) applyProfile(userProfile || FALLBACK_PROFILE);
          return;
        }

        clearAuthState();
      } catch (error) {
        console.error('Session recovery failed:', error);
        clearAuthState();
      } finally {
        recoveryDone = true;
        finishLoading();
      }
    };

    recoverSession();

    // SAFETY: never leave the app in a permanent loading state.
    const safetyTimer = setTimeout(() => {
      if (!authResolved) {
        recoveryDone = true;
        finishLoading();
      }
    }, 15000);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // SIGNED_OUT must always be processed immediately regardless of
      // recovery state — the user explicitly logged out.
      if (event === 'SIGNED_OUT') {
        clearAuthState();
        finishLoading();
        if (routerRef.current.pathname.startsWith('/admin')) {
          routerRef.current.replace('/login');
        }
        return;
      }

      // Skip ALL other events until recoverSession() completes.
      // recoverSession uses getUser() for server-side JWT validation,
      // which is more authoritative than the localStorage-based session
      // in the event payload. Processing events during recovery causes
      // duplicate profile fetches and interleaved state updates.
      if (!recoveryDone) return;

      // Keep user and profile in sync for SIGNED_IN, TOKEN_REFRESHED,
      // and any later auth updates.
      const currentUser = session?.user || null;
      setUser(currentUser);
      syncTokenCookie(session);

      if (currentUser) {
        try {
          const userProfile = await fetchUserProfile(currentUser.id);
          if (isMounted) applyProfile(userProfile);
        } catch {
          // Profile fetch failed — still show the page with user, just no profile
        }
      } else {
        applyProfile(null);
      }

      finishLoading();
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      authListener.subscription?.unsubscribe();
    };
  }, [fetchUserProfile, applyProfile]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      syncTokenCookie(null);
      setUser(null);
      applyProfile(null);
      // Remove Supabase tokens and assistant session from localStorage
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
        localStorage.removeItem('sw-admin-assistant-session');
      }
      router.replace('/login');
    }
  }, [router, applyProfile]);

  const permissions = useMemo(() => getPermissions(role, accessLevel), [role, accessLevel]);

  return (
    <AuthContext.Provider value={{ user, role, accessLevel, department, profile, permissions, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
