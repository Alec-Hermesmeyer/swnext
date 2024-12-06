import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import MarkdownBlogPost from '@/components/MarkdownBlogPost';


export default function BlogPost({ frontmatter, content }) {
  
  return <MarkdownBlogPost frontmatter={frontmatter} content={content}
    style={{ color: "white!important", }}
  />;
}

export async function getStaticPaths() {
  // Read the files from the blog content directory
  const files = fs.readdirSync(path.join('content', 'blog'));

  // Create paths with slug parameter
  const paths = files.map((filename) => ({
    params: {
      slug: filename.replace('.md', ''),
    },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params: { slug } }) {
  // Read the specific markdown file for the given slug
  const markdownWithMeta = fs.readFileSync(
    path.join('content', 'blog', `${slug}.md`),
    'utf-8'
  );

  // Parse frontmatter and markdown content
  const { data: frontmatter, content } = matter(markdownWithMeta);

  // Convert markdown content to HTML using remark
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    props: {
      frontmatter,
      content: contentHtml,
    },
  };
}
