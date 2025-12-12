import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import supabase from '@/components/Supabase';

const withAuthTw = (WrappedComponent) => {
  const Wrapper = (props) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthed, setIsAuthed] = useState(false);

    const checkSession = useCallback(async () => {
      try {
        // First try to refresh the session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          // Try to refresh if there's an error
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session) {
            setIsAuthed(true);
            setLoading(false);
            return;
          }
        }

        if (session) {
          setIsAuthed(true);
        } else {
          router.replace('/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }, [router]);

    useEffect(() => {
      let isMounted = true;

      checkSession();

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        // Handle token refresh events
        if (event === 'TOKEN_REFRESHED') {
          setIsAuthed(true);
          return;
        }

        if (event === 'SIGNED_OUT') {
          setIsAuthed(false);
          router.replace('/login');
          return;
        }

        if (session) {
          setIsAuthed(true);
        } else if (event === 'SIGNED_IN') {
          setIsAuthed(true);
        } else {
          // Don't immediately redirect - try refresh first
          const { data } = await supabase.auth.refreshSession();
          if (!data?.session) {
            setIsAuthed(false);
            router.replace('/login');
          }
        }
      });

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }, [router, checkSession]);

    if (loading) return <p>Loading...</p>;
    if (!isAuthed) return null;
    return <WrappedComponent {...props} />;
  };

  Wrapper.displayName = `withAuthTw(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  // Hoist getLayout so Next uses the admin layout instead of the site layout
  if (WrappedComponent.getLayout) {
    Wrapper.getLayout = WrappedComponent.getLayout;
  }
  return Wrapper;
};

export default withAuthTw;


