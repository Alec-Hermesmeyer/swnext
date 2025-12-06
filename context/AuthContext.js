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

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch the role from 'profiles' table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();
        if (error) console.error(error);
        setRole(profile?.role || 'user'); // Default to 'user'
      }

      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();
        if (error) console.error(error);
        setRole(profile?.role || 'user');
      } else {
        setRole(null);
        // Only redirect to login if on an admin page
        if (router.pathname.startsWith('/admin')) {
          router.push('/login');
        }
      }

      setLoading(false);
    });

    return () => {
      authListener.data?.unsubscribe();
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
