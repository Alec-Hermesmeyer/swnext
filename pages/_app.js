import { useEffect } from 'react'
import TWLayout from '@/components/TWLayout'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"
import GoogleAnalytics from '@/components/Analytics'
import { AuthProvider } from '@/context/AuthContext'
import { ImageProvider } from '@/context/ImageContext'
import { SidebarProvider } from '@/context/SidebarContext'
import '@/styles/globals.css'

export default function App({ Component, pageProps, router }) {
  // Keep auth/session stable: do not unregister service workers during app boot.
  useEffect(() => {}, []);

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