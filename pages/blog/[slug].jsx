import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import Head from "next/head";
import TWLayout from "@/components/TWLayout";
import MarkdownBlogPost from "@/components/MarkdownBlogPost";

export default function BlogPostTW({ frontmatter, content }) {
  return (
    <>
      <Head>
        <title>{frontmatter.title} | Tailwind</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MarkdownBlogPost frontmatter={frontmatter} content={content} />
    </>
  );
}

BlogPostTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};

export async function getStaticPaths() {
  const baseDir = path.join(process.cwd(), "content", "blog");
  const files = fs.readdirSync(baseDir);
  const paths = files.map((filename) => ({ params: { slug: filename.replace(".md", "") } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params: { slug } }) {
  const filePath = path.join(process.cwd(), "content", "blog", `${slug}.md`);
  const markdownWithMeta = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter, content } = matter(markdownWithMeta);
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();
  return { props: { frontmatter, content: contentHtml } };
}


