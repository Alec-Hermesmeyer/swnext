import Image from "next/image";
import { Lato } from "next/font/google";
import Link from "next/link";
import ContactCard from "@/components/ContactCard";

const lato = Lato({
  weight: ["900", "100", "300", "400", "700"],
  subsets: ["latin"],
});

export default function MarkdownBlogPost({ frontmatter, content }) {
  const contact = frontmatter.contact || {};
  const supabaseBase =
    process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public`
      : process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
      ? `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public`
      : "";
  const rawImage = String(frontmatter?.imageId || "").trim();
  const imageSrc = rawImage
    ? /^https?:\/\//i.test(rawImage)
      ? rawImage
      : rawImage.includes("/") || /\.(png|jpe?g|webp|gif|avif)$/i.test(rawImage)
      ? `${supabaseBase}/blog-images/${rawImage}`
      : `${supabaseBase}/Images/public/newimages/${rawImage}.webp`
    : "";
  const publishedDate = frontmatter?.date
    ? new Date(frontmatter.date)
    : null;
  const publishedDateLabel =
    publishedDate && !Number.isNaN(publishedDate.getTime())
      ? publishedDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "";

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link href="/blog" className="text-sm font-semibold text-[#0b2a5a] hover:underline">
            ← Back to Blog
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {imageSrc ? (
            <div className="relative h-[260px] w-full md:h-[360px]">
              <Image
                className="object-cover"
                src={imageSrc}
                fill
                alt={frontmatter.title}
                priority
                unoptimized
                loader={({ src }) => src}
                sizes="(max-width: 1024px) 100vw, 1200px"
              />
            </div>
          ) : null}

          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
            <article>
              {publishedDateLabel ? (
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  {publishedDateLabel}
                </p>
              ) : null}
              <h1 className={`${lato.className} text-3xl font-extrabold leading-tight text-neutral-900 md:text-4xl`}>
                {frontmatter.title}
              </h1>
              {frontmatter.excerpt ? (
                <p className="mt-3 text-base text-neutral-600">{frontmatter.excerpt}</p>
              ) : null}
              <div className="mt-8 border-t border-neutral-200 pt-6">
                <div
                  className="prose prose-neutral max-w-none prose-headings:font-bold prose-a:text-[#0b2a5a] prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </article>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Need a quote?</p>
                <p className="mt-1 text-sm text-neutral-700">
                  Talk with S&W Foundation about your next project.
                </p>
                {contact?.phone ? (
                  <a href={`tel:${String(contact.phone).replace(/[^\d+]/g, "")}`} className="mt-3 inline-flex text-sm font-semibold text-[#0b2a5a] hover:underline">
                    {contact.phone}
                  </a>
                ) : null}
              </div>
              <div className="mt-4">
                <ContactCard />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

// Note: Static generation is handled in page files under /pages/tw/blog
