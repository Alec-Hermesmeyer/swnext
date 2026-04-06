// AuthContext.js
import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/components/Supabase';
import { getPermissions } from '@/lib/roles';

const AuthContext = createContext();

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

    // Bootstrap: recover the existing session on mount (page refresh / first load).
    // Uses getSession() first (fast, reads from storage) then validates with
    // getUser() which forces a server round-trip and token refresh if expired.
    // This is critical in production where access tokens expire between visits
    // and onAuthStateChange fires TOKEN_REFRESHED instead of INITIAL_SESSION.
    const recoverSession = async () => {
      try {
        // 1) Fast path: read session from cookie/storage (no network)
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          // Show the page immediately with the cached session
          setUser(session.user);
          const userProfile = await fetchUserProfile(session.user.id);
          if (isMounted) applyProfile(userProfile);
          if (isMounted) setLoading(false);

          // 2) Then validate server-side (triggers token refresh if expired).
          // This keeps cookies fresh and fires onAuthStateChange if tokens change.
          supabase.auth.getUser().catch(() => {});
          return;
        }

        // No cached session — try server validation in case storage is stale
        const { data: { user: validatedUser } } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (validatedUser) {
          setUser(validatedUser);
          const userProfile = await fetchUserProfile(validatedUser.id);
          if (isMounted) applyProfile(userProfile);
        } else {
          setUser(null);
          applyProfile(null);
          if (routerRef.current.pathname.startsWith('/admin')) {
            routerRef.current.push('/login');
          }
        }
      } catch (err) {
        // If all recovery fails, clear state and redirect
        if (isMounted) {
          setUser(null);
          applyProfile(null);
          if (routerRef.current.pathname.startsWith('/admin')) {
            routerRef.current.push('/login');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    recoverSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        applyProfile(null);
        if (routerRef.current.pathname.startsWith('/admin')) {
          routerRef.current.push('/login');
        }
        setLoading(false);
        return;
      }

      // For ALL other events (SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, etc.)
      // always update user AND fetch profile so role/permissions stay in sync.
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchUserProfile(currentUser.id);
        if (isMounted) applyProfile(userProfile);
      } else {
        applyProfile(null);
        if (routerRef.current.pathname.startsWith('/admin')) {
          routerRef.current.push('/login');
        }
      }

      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription?.unsubscribe();
    };
  }, [fetchUserProfile, applyProfile]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    applyProfile(null);
    router.push('/login');
  };

  const permissions = useMemo(() => getPermissions(role, accessLevel), [role, accessLevel]);

  return (
    <AuthContext.Provider value={{ user, role, accessLevel, department, profile, permissions, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
