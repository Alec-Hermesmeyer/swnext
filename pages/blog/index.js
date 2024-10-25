import { useEffect, useState } from 'react';
import supabase from '@/components/Supabase';
import Link from 'next/link';

export default function Blog() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase.from('blog_posts').select('*').eq('published', true);
      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div>
      <h1>Blog</h1>
      {posts.length === 0 ? (
        <p>No blog posts available.</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/blog/${post.id}`}>
                <a>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
