import Layout from '@/components/Layout'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"
import PreloadImages from '@/components/PreloadImages'
import { AuthProvider } from '@/context/AuthContext'
import { Router } from 'next/router'
import '@/styles/globals.css'



export default function App({ Component, pageProps, router }) {
  if(typeof window !== 'undefined' && 'serviceWorker' in window.navigator){
    window.addEventListener('load', () => {
      window.navigator.serviceWorker.register('/service-worker.js');
    });
  }
  const getLayout = Component.getLayout || ((page) => page);

  if (router.pathname.startsWith('/admin')) {
    const AdminLayout = require('../components/AdminLayout').default;
    return (
      <AdminLayout>
        <AuthProvider>
        <Component {...pageProps} />
        </AuthProvider>
      </AdminLayout>
    );
  } else {
    return (
      <Layout>
        <PreloadImages />
        <AuthProvider>
        <Component {...pageProps} />
        </AuthProvider>
        <Analytics />
  
        <SpeedInsights />
  
      </Layout>
    )
  }
  
}
