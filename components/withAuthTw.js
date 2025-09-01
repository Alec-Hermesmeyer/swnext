import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import supabase from '@/components/Supabase';

const withAuthTw = (WrappedComponent) => {
  const Wrapper = (props) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
      let isMounted = true;
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session) {
          setIsAuthed(true);
        } else {
          router.replace('/tw/login');
        }
        setLoading(false);
      };

      checkSession();
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        if (session) {
          setIsAuthed(true);
        } else {
          setIsAuthed(false);
          router.replace('/tw/login');
        }
      });

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }, [router]);

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


