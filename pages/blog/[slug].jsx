import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import Head from "next/head";
import MarkdownBlogPost from "@/components/MarkdownBlogPost";

export default function BlogPostTW({ frontmatter, content }) {
  return (
    <>
      <Head>
        <title>{frontmatter.title} | S&W Foundation Blog</title>
        <meta name="description" content={frontmatter.excerpt || `Read ${frontmatter.title} on the S&W Foundation blog - insights and updates from commercial pier drilling experts.`} />
      </Head>
      <MarkdownBlogPost frontmatter={frontmatter} content={content} />
    </>
  );
}


export async function getStaticPaths() {
  const baseDir = path.join(process.cwd(), "content", "blog");
  const files = fs.readdirSync(baseDir);
  const paths = files
    .map((filename) => {
      const filePath = path.join(baseDir, filename);
      const markdownWithMeta = fs.readFileSync(filePath, "utf-8");
      const { data: frontmatter } = matter(markdownWithMeta);
      return {
        slug: filename.replace(".md", ""),
        status: String(frontmatter?.status || "published").toLowerCase(),
      };
    })
    .filter((entry) => entry.status !== "draft")
    .map((entry) => ({ params: { slug: entry.slug } }));
  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params: { slug } }) {
  const filePath = path.join(process.cwd(), "content", "blog", `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return { notFound: true, revalidate: 30 };
  }
  const markdownWithMeta = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter, content } = matter(markdownWithMeta);
  if (String(frontmatter?.status || "published").toLowerCase() === "draft") {
    return { notFound: true, revalidate: 30 };
  }
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();
  return { props: { frontmatter, content: contentHtml }, revalidate: 120 };
}


