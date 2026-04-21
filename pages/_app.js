import TWLayout from '@/components/TWLayout'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"
import GoogleAnalytics from '@/components/Analytics'
import { AuthProvider } from '@/context/AuthContext'
import { ImageProvider } from '@/context/ImageContext'
import { SidebarProvider } from '@/context/SidebarContext'
import '@/styles/globals.css'

/**
 * Providers (Auth / Image / Sidebar) live at the very top so they persist
 * across every route change. The page layout is the only thing that swaps
 * below them, which means AuthProvider.recoverSession() runs once per tab
 * lifecycle — not once per navigation. Stops the "getting signed out on
 * navigate" behavior caused by AuthProvider remounting when the tree
 * switched between getLayout and default branches.
 */
export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);
  const hasCustomLayout = Boolean(Component.getLayout);

  const pageElement = <Component {...pageProps} />;
  const rendered = hasCustomLayout ? (
    getLayout(pageElement)
  ) : (
    <>
      <GoogleAnalytics />
      <TWLayout>
        {pageElement}
        <Analytics />
        <SpeedInsights />
      </TWLayout>
    </>
  );

  return (
    <AuthProvider>
      <ImageProvider>
        <SidebarProvider>
          {rendered}
        </SidebarProvider>
      </ImageProvider>
    </AuthProvider>
  );
}
