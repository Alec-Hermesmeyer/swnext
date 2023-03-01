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
        <title>S&amp;W Foundation | Commercial Foundation Drilling Company</title>
        <meta name="description" content="S&amp;W Foundation provides high-quality commercial pier drilling services in the United States. Contact us today for a quote! Trust S&amp;W for and unmatched combo of expierience, equipment and safety" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Commercial Pier Drilling | S&amp;W Foundation" />
        <meta property="og:description" content="S&amp;W Foundation provides high-quality commercial pier drilling services in the United States. Contact us today for a quote!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.swfoundation.com/" />
        <meta property="og:image" content="https://www.swfoundation.com/images/logo.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Commercial Pier Drilling | S&amp;W Foundation" />
        <meta name="twitter:description" content="S&amp;W Foundation provides high-quality commercial pier drilling services in the United States. Contact us today for a quote!" />
        <meta name="twitter:image" content="https://www.swfoundation.com/images/logo.png" />
        <link rel="canonical" href="https://www.swfoundation.com/" />
        <link rel="icon" href="/favicon.ico" />
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
