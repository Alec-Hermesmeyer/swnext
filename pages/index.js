import Head from 'next/head';
import Image from 'next/image';
import styles from '@/styles/Home.module.css';
import Hero from '@/components/Hero';
import Info from '@/components/Info';
import Grid from '@/components/Grid';
import SocialGrid from '@/components/SocialGrid';
import handler from '../pages/api/gridData';


const LogoImage = () => (
  <Image
    className={styles.logo}
    src='/att.png'
    height={300}
    width={300}
    alt='S&amp;W Foundations Logo'
    loading='lazy'
    quality={80}
  />
);

export default function Home({ data}) {


  return (
    <>
     <Head>
    <title>S&W Foundation | Leading Commercial Pier Drilling & Construction Services in Dallas, TX</title>
    <meta name="description" content="S&W Foundation, based in Dallas, TX, offers premier commercial pier drilling, crane, trucking, and turnkey construction solutions. With unparalleled experience, top-tier equipment, and a stellar safety record, we're your trusted partner for commercial construction support in the US." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <meta property="og:title" content="S&W Foundation | Expert Commercial Construction & Pier Drilling in Dallas, TX" />
    <meta property="og:description" content="From commercial pier drilling to turnkey construction solutions, S&W Foundation stands as the go-to choice for businesses across the US. Discover our legacy of excellence." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/" />
    <meta property="og:image" content="https://www.swfoundation.com/images/logo.png" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="S&W Foundation | Dallas, TX's Premier Commercial Construction Partner" />
    <meta name="twitter:description" content="Expertise in commercial pier drilling, crane & trucking services, and more. See why businesses trust S&W Foundation for their construction needs." />
    <meta name="twitter:image" content="https://www.swfoundation.com/images/logo.png" />
    
    <link rel="canonical" href="https://www.swfoundation.com/" />
    <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
</Head>


      <div className={styles.main}>
        <section style={{ marginBottom: 5 }} className={styles.hero}><Hero />
          
        </section>
        <section style={{ marginBottom: 5 }} className={styles.info}><Info /></section>
        <section className={styles.gridSection}><Grid data={data} /></section>
        <div className={styles.break1}></div>
        <div className={styles.image}>
          <LogoImage />
        </div>
        <br />
        <div className={styles.break2}></div>
        <section className={styles.socialG}><SocialGrid /></section>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  const data = await handler();

  return {
    props: {  data }
  };
}
