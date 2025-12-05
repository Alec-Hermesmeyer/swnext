import TWLayout from '@/components/TWLayout'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"
import GoogleAnalytics from '@/components/Analytics'
import { AuthProvider } from '@/context/AuthContext'
import { ImageProvider } from '@/context/ImageContext'
import '@/styles/globals.css'

export default function App({ Component, pageProps, router }) {
  if (typeof window !== 'undefined' && 'serviceWorker' in window.navigator) {
    window.addEventListener('load', () => {
      window.navigator.serviceWorker.register('/service-worker.js');
    });
  }

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