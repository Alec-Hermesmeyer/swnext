import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import supabase from '@/components/Supabase';



const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Function to fetch the current user session
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
      } else {
        setUser(session?.user || null);
        setLoading(false);
      }
    };

    // Fetch the user session on mount
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null);
        setLoading(false);
        if (!session?.user) {
          router.push('/login');
        }
      });

    return () => {
        authListener.data?.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);