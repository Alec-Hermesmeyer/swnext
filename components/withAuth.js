import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const withAuth = (WrappedComponent) => {
  const Wrapper = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [loading, user, router]);

    if (loading) {
      return <p>Loading...</p>; // Or any loading component
    }

    if (!user) {
      return null; // Or a redirect message, or you can handle this differently
    }

    return <WrappedComponent {...props} />;
  };

  Wrapper.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return Wrapper;
};

export default withAuth;
