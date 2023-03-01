import Layout from '@/components/Layout'
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
    </Layout>
  )
}
