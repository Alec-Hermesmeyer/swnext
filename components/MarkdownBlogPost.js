import Image from "next/image";
import { useState, useEffect } from "react";
import supabase from "@/components/Supabase";
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
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
  const supabaseUrl = frontmatter.imageId && projectId
    ? `https://${projectId}.supabase.co/storage/v1/object/public/Images/public/newimages/${frontmatter.imageId}.webp`
    : "";
  const imageSrc = imageUrl || supabaseUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="">
                <div className="">
                  <div className="">
                    <div className="">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {imageSrc && (
                          <span className="relative aspect-video rounded-lg overflow-hidden">
                            <Image
                              className="object-cover w-full h-full"
                              src={imageSrc}
                              height={470}
                              width={520}
                              alt={frontmatter.title}
                              priority
                              unoptimized
                              loader={({ src }) => src}
                              sizes="(max-width: 768px) 90vw, 520px"
                            />
                          </span>
                        )}
                        
                          <ContactCard />
                        
                      </div>
                      <div className="space-y-6">
                        <h1 className={lato.className}>{frontmatter.title}</h1>
                        <article
                          className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
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

// Note: Static generation is handled in page files under /pages/tw/blog
