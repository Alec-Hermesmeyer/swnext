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

  // Keep router ref current without triggering effect re-runs
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

    const getInitialSession = async () => {
      try {
        // Try to get existing session
        const { data: { session }, error } = await supabase.auth.getSession();

        // If error or no session, try refreshing
        if (error || !session) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session && isMounted) {
            setUser(refreshData.session.user);
            const userProfile = await fetchUserProfile(refreshData.session.user.id);
            if (isMounted) applyProfile(userProfile);
            setLoading(false);
            return;
          }
        }

        if (!isMounted) return;

        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          const userProfile = await fetchUserProfile(currentUser.id);
          if (isMounted) applyProfile(userProfile);
        } else if (isMounted) {
          applyProfile(null);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Handle specific events
      if (event === 'TOKEN_REFRESHED' && session) {
        setUser(session.user);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        applyProfile(null);
        if (routerRef.current.pathname.startsWith('/admin')) {
          routerRef.current.push('/login');
        }
        return;
      }

      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchUserProfile(currentUser.id);
        if (isMounted) applyProfile(userProfile);
      } else {
        applyProfile(null);
        // Only redirect to login if on an admin page
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

  const permissions = useMemo(() => getPermissions(role), [role]);

  return (
    <AuthContext.Provider value={{ user, role, department, profile, permissions, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
