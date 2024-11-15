"use client"
import React, { useState, useEffect } from "react";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/BlogPage.module.css';
import { Lato } from "next/font/google";
import { GridPattern } from "@/components/GridPattern";
import { FadeIn } from "@/components/FadeIn";
import supabase from "@/components/Supabase";
import Head from "next/head";

const lato = Lato({
  weight: ["900", "100", "300", "400", "700"],
  subsets: ["latin"],
});
function Spacer() {
  return (
    <GridPattern />
  )
}
function JobPostings() {
  const [jobPostings, setJobPostings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobPostings = async () => {
      let { data, error } = await supabase.from("jobs").select("*");
      if (error) {
        console.log(error);
      } else {
        setJobPostings(data);
      }
      setIsLoading(false);
    };
    fetchJobPostings();
    const subscription = supabase
    .channel('public:jobs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setJobPostings((currentJobs) => [...currentJobs, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setJobPostings((currentJobs) =>
          currentJobs.map((job) => (job.id === payload.new.id ? payload.new : job))
        );
      } else if (payload.eventType === 'DELETE') {
        setJobPostings((currentJobs) =>
          currentJobs.filter((job) => job.id !== payload.old.id)
        );
      }
    })
    .subscribe();

  // Cleanup subscription on unmount
  return () => {
    supabase.removeChannel(subscription);
  };
}, []);
  if (isLoading) {
    return <div>Loading....</div>;
  }
  // Filter the jobPostings to only include those where isOpen is true
  const openJobPostings = jobPostings.filter(jobPosting => jobPosting.is_Open);
  return (
    <div className={styles.jobPostingsSection}>
      <h2 className={lato.className}>Join our Team</h2>
      <div className={styles.grid}>
      {openJobPostings.map((jobPosting, index) => (
        <div className={styles.card} key={index}>
          <FadeIn>
        <details className={styles.jobPostInfo}>
        <summary className={lato.className}>{jobPosting.jobTitle}</summary>
        {/* <p className={lato.className}>{jobPosting.jobDesc}</p> */}
        <span className={styles.jobBtns}><Link className={styles.infoBtn3} href='/contact#jobForm'><p className={lato.className}>Apply Today</p></Link></span>
      </details>
      </FadeIn>
      </div>
      ))}
      </div>
    </div>
  );
}


export default function Blog({ posts }) {
  return (
    <>
    <Head>
      <title>
        S&amp;W Foundation | Leading Commercial Pier Drilling &amp;
        Construction Services in Dallas, TX
      </title>
      <meta
        name="description"
        content="S&amp;W Foundation, based in Dallas, TX, offers premier commercial pier drilling, crane, trucking, and turnkey construction solutions. With unparalleled experience, top-tier equipment, and a stellar safety record, we're your trusted partner for commercial construction support in the US."
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        property="og:title"
        content="S&amp;W Foundation Latest News | Expert Commercial Construction &amp; Pier Drilling in Dallas, TX"
      />
      <meta
        property="og:description"
        content="From commercial pier drilling to turnkey construction solutions, S&amp;W Foundation stands as the go-to choice for businesses across the US. Discover our legacy of excellence."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://www.swfoundation.com/blog" />
      <meta
        property="og:image"
        content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/att.webp?t=2024-04-16T20%3A11%3A20.126Z"
      />
      <meta
        name="keywords"
        content="commercial pier drilling, construction services, Dallas, TX, S&W Foundation, crane services, trucking services, turnkey construction, trusted partner, commercial construction support, US, top-tier equipment, safety record"
      />
      <meta name="twitter:card" content="summary" />
      <meta
        name="twitter:title"
        content="S&amp;W Foundation | Dallas, TX's Premier Commercial Construction Partner"
      />
      <meta
        name="twitter:description"
        content="Expertise in commercial pier drilling, crane &amp; trucking services, and more. See why businesses trust S&amp;W Foundation for their construction needs."
      />
      <meta
        name="twitter:image"
        content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/att.webp?t=2024-04-16T20%3A11%3A20.126Z"
      />
      <link rel="canonical" href="https://www.swfoundation.com/blog" />
      <link
        rel="icon"
        href="/android-chrome-512x512.png"
        type="image/x-icon"
      />
      
    </Head>

    <div className={styles.blogPage}>
      <h1 className={lato.className}>Latest News, Tips, and  Stories from S&amp;W Foundation</h1>
      {posts.length === 0 ? (
        <p>No blog posts available.</p>
      ) : (
        <div className={styles.blogGrid}>
          {posts.map((post) => {
            const imagePath = `/Images/public/newimages/${post.imageId}.webp`;
            return (
              <div key={post.slug} className={styles.blogCard}>
                <Link href={`/blog/${post.slug}`} passHref>
                  <div>
                    <Image
                      src={imagePath}
                      alt={post.title}
                      width={300}
                      height={200}
                      className={styles.blogImage}
                    />
                    <h3 className={`${lato.className} ${styles.blogTitle}`}>
                      {post.title}
                    </h3>
                    <p className={`${lato.className} ${styles.blogExcerpt}`}>
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
      <section className={styles.contactSection}>
      <div className={styles.spacer}>
          <GridPattern className={styles.gridPattern} yOffset={10} interactive />
          </div>
          </section>
          
          <JobPostings />
    </div>
    </>
  );
}

export async function getStaticProps() {
  const files = fs.readdirSync(path.join('content', 'blog'));

  const posts = files.map((filename) => {
    const slug = filename.replace('.md', '');
    const markdownWithMeta = fs.readFileSync(
      path.join('content', 'blog', filename),
      'utf-8'
    );

    const { data: frontmatter } = matter(markdownWithMeta);

    return {
      slug,
      ...frontmatter,
    };
  });

  return {
    props: {
      posts,
    },
  };
}
