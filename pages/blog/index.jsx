import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const formatBlogDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getSupabasePublicBase = () => {
  const direct = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (direct) return `${direct.replace(/\/$/, "")}/storage/v1/object/public`;
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
  if (projectId) return `https://${projectId}.supabase.co/storage/v1/object/public`;
  return "";
};

const resolveBlogImage = (imageId) => {
  const base = getSupabasePublicBase();
  if (!base || !imageId) return "";
  const raw = String(imageId).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.includes("/") || /\.(png|jpe?g|webp|gif|avif)$/i.test(raw)) {
    return `${base}/blog-images/${raw}`;
  }
  return `${base}/Images/public/newimages/${raw}.webp`;
};

export default function BlogIndexTW({ posts }) {
  return (
    <>
      <Head>
        <title>Blog | S&W Foundation - Latest News and Insights</title>
        <meta name="description" content="Stay updated with the latest news, insights, and industry updates from S&W Foundation Contractors. Expert perspectives on commercial pier drilling and foundation services." />
      </Head>
      <main className="flex w-full flex-col bg-neutral-50">
        <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex min-h-[38vh] w-screen items-center text-white">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/homeHero.webp')" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/45" />
          <div className="relative mx-auto w-full max-w-[1200px] px-6 py-14 text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">S&W Insights</p>
            <h1 className={`${lato.className} mt-2 text-4xl font-extrabold leading-tight md:text-5xl`}>
              Foundations, Field Notes, and Project Insights
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
              Practical updates from active jobs, crew workflows, and commercial foundation work across Texas.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1200px] px-6 py-12">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-600 shadow-sm">
              No blog posts available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const imagePath = resolveBlogImage(post.imageId);
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      {imagePath ? (
                        <Image
                          src={imagePath}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                          loader={({ src }) => src}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-neutral-100 text-sm font-semibold text-neutral-500">
                          S&W Foundation
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      {post.date ? (
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                          {formatBlogDate(post.date)}
                        </p>
                      ) : null}
                      <h3 className={`${lato.className} text-lg font-extrabold text-neutral-900`}>{post.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{post.excerpt}</p>
                      <p className="mt-4 text-sm font-semibold text-[#0b2a5a]">Read article →</p>
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
  }).filter((post) => String(post?.status || "published").toLowerCase() !== "draft").sort((a, b) => {
    const aDate = new Date(a?.date || 0).getTime();
    const bDate = new Date(b?.date || 0).getTime();
    return bDate - aDate;
  });
  return { props: { posts }, revalidate: 120 };
}


