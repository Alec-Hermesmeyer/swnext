import React, { useState, useEffect } from "react";
import styles from "@/styles/Admin.module.css";
import withAuth from "@/components/withAuth";
// import { truncateText } from "@/utils/truncateText";
import { GridPattern } from "@/components/GridPattern";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/components/Supabase";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import AdminLayout from "@/components/AdminLayout";
import Image from "next/image";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Spacer() {
  return (
    <GridPattern
      className={styles.gridPattern}
      yOffset={10}
      interactive={true}
    />
  );
}
const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    excerpt: "",
    published: false,
    imageUrl: "",
  });
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const response = await fetch("/api/images"); // Call your API route
      const data = await response.json();
      setImages(data); // Set the images returned from the API
    };

    fetchPosts(); // Fetch images when component mounts
  }, []);

  const handleAddPost = async (e) => {
    e.preventDefault();
    const { title, content, excerpt, published } = newPost;
    const response = await fetch("/api/blog-posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        excerpt,
        published,
        imageUrl: selectedImage?.url,
      }),
    });

    if (response.ok) {
      const newPost = await response.json();
      setPosts([...posts, newPost]);
      setNewPost({ title: "", content: "", excerpt: "", published: false });
      setSelectedImage(null);
    }
  };

  return (
    <div className={styles.admin}>
       <Spacer className={styles.spacer} />
      <div className={styles.blogPage}>
      <div className={styles.blogContainer}>
        <div className={styles.blogLeft}>
      <h2 className={lato.className}>Manage Blog Posts</h2>
      <form className={styles.blogForm} onSubmit={handleAddPost}>
        <label className={lato.className}>
          Title:
          <input
            type="text"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            required
          />
        </label>
        <label className={lato.className}>
          Excerpt:
          <textarea
            value={newPost.excerpt}
            onChange={(e) =>
              setNewPost({ ...newPost, excerpt: e.target.value })
            }
          />
        </label>
        <label className={lato.className}>
          Content:
          <textarea
            value={newPost.content}
            onChange={(e) =>
              setNewPost({ ...newPost, content: e.target.value })
            }
            required
          />
        </label>
        <label className={lato.className}>
          Published:
          <input
            type="checkbox"
            checked={newPost.published}
            onChange={(e) =>
              setNewPost({ ...newPost, published: e.target.checked })
            }
          />
        </label>
        <button className={lato.className} type="submit">Add Post</button>
        </form>
        </div>
        <div className={styles.blogRight}>
        {/* Displaying Images */}
        <h3 className={lato.className}>Select an Image for the Post:</h3>
        <div className={styles.imageGrid}>
          {images.map((image) => (
            <div
              key={image.name}
              style={{ position: "relative", width: "100%", height: "auto" }}
            >
              {/* <img src={image.url} alt={image.name} style={{ width: '100px', height: '100px' }} /> */}
              <Image
                src={`Images/public/${image.name}`} // Use the full URL from Supabase
                alt={image.name}
                width={100} // Specify width
                height={100} // Specify height
                priority
                quality={80}
                onClick={() => setSelectedImage(image)}
                style={{
                  margin: "10px",
                  border:
                    selectedImage?.name === image.name
                      ? "3px solid blue"
                      : "1px solid gray",
                  padding: "5px",
                  cursor: "pointer",
                  height: "100px",
                  width: "100px"
                }}
              />
            </div>
          ))}
        </div>
        </div>
       
      
      </div>
      </div>
    </div>
  );
};
export default withAuth(Blog);
