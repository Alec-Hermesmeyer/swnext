import TWLayout from '@/components/TWLayout'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { AuthProvider } from '@/context/AuthContext'
import '@/styles/globals.css'

export default function App({ Component, pageProps, router }) {
  if (typeof window !== 'undefined' && 'serviceWorker' in window.navigator) {
    window.addEventListener('load', () => {
      window.navigator.serviceWorker.register('/service-worker.js');
    });
  }

  const getLayout = Component.getLayout || ((page) => page);

  if (router.pathname.startsWith('/admin')) {
    const TWAdminLayout = require('../components/TWAdminLayout').default;
    return (
      <AuthProvider>
        <TWAdminLayout>
          {getLayout(<Component {...pageProps} />)}
        </TWAdminLayout>
      </AuthProvider>
    );
  } else {
    // If the page provides its own layout, use it exclusively
    if (Component.getLayout) {
      return getLayout(<Component {...pageProps} />);
    }
    // Otherwise, wrap with the Tailwind Layout
    return (
      <TWLayout>
        {getLayout(<Component {...pageProps} />)}
        <Analytics />
        <SpeedInsights />
      </TWLayout>
    );
  }
}