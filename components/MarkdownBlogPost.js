import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import Image from "next/image";
import { useState, useEffect } from "react";
import supabase from "@/components/Supabase";
import styles from "../styles/Blog.module.css";
import { Lato } from "next/font/google";
import Link from "next/link";
import ContactCard from "@/components/ContactCard";

const lato = Lato({
  weight: ["900", "100", "300", "400", "700"],
  subsets: ["latin"],
});

export default function MarkdownBlogPost({ frontmatter, content }) {
  const [imageUrl, setImageUrl] = useState("");

  // Fetch image URL from Supabase based on the identifier
  useEffect(() => {
    const fetchImage = async () => {
      if (frontmatter.imageId) {
        const { data, error } = await supabase.storage
          .from("Images")
          .getPublicUrl(`public/newimages/${frontmatter.imageId}.webp`);

        if (error) {
          console.error("Error fetching image:", error);
        } else {
          console.log("Fetched image URL:", data.publicUrl); // Add this line
          setImageUrl(data.publicUrl);
        }
      }
    };
    fetchImage();
  }, [frontmatter.imageId]);
  console.log(frontmatter.imageId);

  const contact = frontmatter.contact || {};
  console.log(contact.contactUrl);
  const imagePath = `/Images/public/newimages/${frontmatter.imageId}.webp`;

  return (
    <div className={styles.post}>
      <div className={styles.postContainer}>
        <div className={styles.postWrapper}>
          <div className={styles.introSection}>
            <div className={styles.introContainer}>
              <div className={styles.introWrapper}>
                <div className={styles.introContent}>
                  <div className={styles.introContentContainer}>
                    <div className={styles.introContentWrapper}>
                      <div className={styles.introContentLeft}>
                        {imagePath && (
                          <span className={styles.imageContainer}>
                            <Image
                              className={styles.blogImg}
                              src={imagePath}
                              height={470}
                              width={520}
                              alt={frontmatter.title}
                              priority
                            />
                          </span>
                        )}
                        
                          <ContactCard />
                        
                      </div>
                      <div className={styles.introContentRight}>
                        <h1 className={lato.className}>{frontmatter.title}</h1>
                        <article
                          className={styles.blogArticle}
                          dangerouslySetInnerHTML={{ __html: content }}
                        ></article>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const files = fs.readdirSync(path.join("content", "blog"));

  const paths = files.map((filename) => ({
    params: {
      slug: filename.replace(".md", ""),
    },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params: { slug } }) {
  const markdownWithMeta = fs.readFileSync(
    path.join("content", "blog", `${slug}.md`),
    "utf-8"
  );

  const { data: frontmatter, content } = matter(markdownWithMeta);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    props: {
      frontmatter,
      content: contentHtml,
    },
  };
}
