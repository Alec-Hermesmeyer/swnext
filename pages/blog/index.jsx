import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

export default function BlogIndexTW({ posts }) {
  return (
    <>
      <Head>
        <title>Blog | S&W Foundation - Latest News and Insights</title>
        <meta name="description" content="Stay updated with the latest news, insights, and industry updates from S&W Foundation Contractors. Expert perspectives on commercial pier drilling and foundation services." />
      </Head>
      <main className="flex w-full flex-col">
        <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[30vh] flex items-center">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/homeHero.webp')" }} />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative mx-auto w-full px-0 py-12 text-center">
            <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Latest News</h1>
          </div>
        </section>
        <section className="mx-auto w-full max-w-[1200px] px-6 py-10">
          {posts.length === 0 ? (
            <p>No blog posts available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const supa = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
                const imagePath = supa
                  ? `https://${supa}.supabase.co/storage/v1/object/public/Images/public/newimages/${post.imageId}.webp`
                  : "";
                return (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group block overflow-hidden rounded-2xl bg-white shadow ring-1 ring-black/10">
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={imagePath}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                        loader={({ src }) => src}
                      />
                    </div>
                    <div className="p-5">
                      <h3 className={`${lato.className} text-lg font-extrabold text-neutral-900`}>{post.title}</h3>
                      <p className="mt-2 text-sm text-neutral-600">{post.excerpt}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}


export async function getStaticProps() {
  const files = fs.readdirSync(path.join(process.cwd(), "content", "blog"));
  const posts = files.map((filename) => {
    const slug = filename.replace(".md", "");
    const markdownWithMeta = fs.readFileSync(
      path.join(process.cwd(), "content", "blog", filename),
      "utf-8"
    );
    const { data: frontmatter } = matter(markdownWithMeta);
    return { slug, ...frontmatter };
  });
  return { props: { posts } };
}


