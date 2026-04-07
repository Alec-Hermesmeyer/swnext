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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, department, full_name, username, access_level')
        .eq('id', userId)
        .single();
      if (error) console.error('Profile fetch error:', error);
      return data || null;
    } catch (err) {
      console.error('Profile fetch failed:', err);
      return null;
    }
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
    const recoverSession = async () => {
      try {
        const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (validatedUser && !userError) {
          setUser(validatedUser);
          const { data: { session } } = await supabase.auth.getSession();
          syncTokenCookie(session);
          const userProfile = await fetchUserProfile(validatedUser.id);
          if (isMounted) applyProfile(userProfile);
          return;
        }

        // Server validation failed — fall back to local session (offline)
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          syncTokenCookie(session);
          const userProfile = await fetchUserProfile(session.user.id);
          if (isMounted) applyProfile(userProfile);
          return;
        }

        clearAuthState();
      } catch (error) {
        console.error('Session recovery failed:', error);
        clearAuthState();
      } finally {
        finishLoading();
      }
    };

    recoverSession();

    // SAFETY: never leave the app in a permanent loading state.
    const safetyTimer = setTimeout(() => {
      if (!authResolved) finishLoading();
    }, 15000);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // recoverSession already handles the initial load — skip to avoid a
      // race condition where both paths fetch the profile concurrently.
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        clearAuthState();
        finishLoading();
        if (routerRef.current.pathname.startsWith('/admin')) {
          routerRef.current.replace('/login');
        }
        return;
      }

      // Keep user and profile in sync for INITIAL_SESSION, SIGNED_IN,
      // TOKEN_REFRESHED, and any later auth updates.
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
      // Remove any lingering Supabase localStorage keys
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
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
