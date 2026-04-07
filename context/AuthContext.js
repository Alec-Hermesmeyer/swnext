// AuthContext.js
import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/components/Supabase';
import { getPermissions } from '@/lib/roles';

const AuthContext = createContext();

/** Sync access token to a cookie so legacy API routes can read it.
 *  The middleware now sets proper HttpOnly session cookies — new API routes
 *  should use createServerSupabase() from lib/supabase.js instead. */
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

    // Bootstrap from the locally persisted Supabase session first so refreshes
    // restore immediately without waiting for auth events or a network round-trip.
    const recoverSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        const currentUser = session?.user || null;
        setUser(currentUser);
        syncTokenCookie(session);

        if (currentUser) {
          finishLoading();
          const userProfile = await fetchUserProfile(currentUser.id);
          if (isMounted) applyProfile(userProfile);

          // Revalidate in the background so expired tokens can refresh
          // without blocking the initial page restore.
          supabase.auth.getUser().catch(() => {});
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      syncTokenCookie(null);
      setUser(null);
      applyProfile(null);
      router.replace('/login');
    }
  };

  const permissions = useMemo(() => getPermissions(role, accessLevel), [role, accessLevel]);

  return (
    <AuthContext.Provider value={{ user, role, accessLevel, department, profile, permissions, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
