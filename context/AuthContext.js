// AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/components/Supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // store role here
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserRole = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) console.error('Role fetch error:', error);
      return profile?.role || 'user';
    } catch (err) {
      console.error('Role fetch failed:', err);
      return 'user';
    }
  };

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
            const userRole = await fetchUserRole(refreshData.session.user.id);
            setRole(userRole);
            setLoading(false);
            return;
          }
        }

        if (!isMounted) return;

        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          const userRole = await fetchUserRole(currentUser.id);
          if (isMounted) setRole(userRole);
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
        setRole(null);
        if (router.pathname.startsWith('/admin')) {
          router.push('/login');
        }
        return;
      }

      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const userRole = await fetchUserRole(currentUser.id);
        if (isMounted) setRole(userRole);
      } else {
        setRole(null);
        // Only redirect to login if on an admin page
        if (router.pathname.startsWith('/admin')) {
          router.push('/login');
        }
      }

      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription?.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
