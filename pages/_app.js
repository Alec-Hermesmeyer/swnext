import { useEffect, useRef } from 'react'
import TWLayout from '@/components/TWLayout'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"
import GoogleAnalytics from '@/components/Analytics'
import { AuthProvider } from '@/context/AuthContext'
import { ImageProvider } from '@/context/ImageContext'
import '@/styles/globals.css'

export default function App({ Component, pageProps, router }) {
  // Unregister stale service workers once after mount — NOT on every render.
  // Running this synchronously in the render body raced with Supabase's
  // BroadcastChannel / cookie-sync and broke session persistence in Chrome,
  // Firefox, and Edge (Safari was unaffected due to weaker SW support).
  const swCleanedRef = useRef(false);
  useEffect(() => {
    if (swCleanedRef.current) return;
    const pathname = router?.pathname || '';
    const shouldCleanServiceWorker =
      pathname.startsWith('/admin') || pathname === '/login';
    if (!shouldCleanServiceWorker) return;
    swCleanedRef.current = true;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }
  }, [router?.pathname]);

  const getLayout = Component.getLayout || ((page) => page);

  // If the page provides its own layout (admin pages, login, etc.), use it exclusively
  if (Component.getLayout) {
    return (
      <AuthProvider>
        <ImageProvider>
          {getLayout(<Component {...pageProps} />)}
        </ImageProvider>
      </AuthProvider>
    );
  }

  // Otherwise, wrap with the default Tailwind Layout
  return (
    <AuthProvider>
      <ImageProvider>
        <GoogleAnalytics />
        <TWLayout>
          <Component {...pageProps} />
          <Analytics />
          <SpeedInsights />
        </TWLayout>
      </ImageProvider>
    </AuthProvider>
  );
}