import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const withAuthTw = (WrappedComponent) => {
  const Wrapper = (props) => {
    const router = useRouter();
    const { user, loading } = useAuth();
    const isEmbedded = router.query?.embedded === "true";
    const [timedOut, setTimedOut] = useState(false);

    // In embedded mode (iframe), give auth a few seconds then render anyway
    // The parent page already authenticated — shared cookies mean the session exists
    useEffect(() => {
      if (!isEmbedded || !loading) return;
      const timer = setTimeout(() => setTimedOut(true), 3000);
      return () => clearTimeout(timer);
    }, [isEmbedded, loading]);

    useEffect(() => {
      if (!loading && !user && !isEmbedded) {
        router.replace('/login');
      }
    }, [user, loading, router, isEmbedded]);

    if (loading && !timedOut) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-neutral-600">Loading...</span>
          </div>
        </div>
      );
    }

    // In embedded mode, render even if user hasn't resolved yet
    if (!user && !isEmbedded) return null;

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
