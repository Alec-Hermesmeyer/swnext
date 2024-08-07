// components/PreloadImages.js
import { useEffect } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PreloadImages = () => {
  useEffect(() => {
    const preloadImages = async () => {
      const response = await fetch('/api/preload-images');
      const images = await response.json();

      images.forEach(image => {
        const img = new Image();
        img.src = `${supabaseUrl}/storage/v1/object/public/Images/public/${image.folder}/${image.name}`;
        console.log(`Preloading image: ${img.src}`);
      });
    };

    preloadImages();
  }, []);

  return null;
};

export default PreloadImages;
