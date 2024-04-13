import Layout from '@/components/Layout'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/next"
import '@/styles/globals.css'



export default function App({ Component, pageProps }) {
  if(typeof window !== 'undefined' && 'serviceWorker' in window.navigator){
    window.addEventListener('load', () => {
      window.navigator.serviceWorker.register('/service-worker.js');
    });
  }
  return (
    <Layout>
      <Component {...pageProps} />
      <Analytics />

      <SpeedInsights />

    </Layout>
  )
}
