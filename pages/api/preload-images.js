import NodeCache from 'node-cache';
import supabase from "@/components/Supabase";

// Initialize cache with a time-to-live (TTL) of 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600 });

export default async function handler(_, res) {
  // Check if images are already cached
  const cachedImages = cache.get('images');

  if (cachedImages) {
    console.log('Serving images from cache');
    // Set cache headers for CDN caching
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=59');
    return res.status(200).json(cachedImages);
  }

  console.log('Fetching and caching images from Supabase');
  const folders = ['newimages', 'galleryImages'];
  let images = [];

  for (const folder of folders) {
    const { data, error } = await supabase
      .storage
      .from('Images')
      .list(`public/${folder}`, { limit: 100 });

    if (error) {
      console.error(`Error fetching images from folder ${folder}:`, error.message);
      return res.status(500).json({ error: error.message });
    }

    for (const file of data) {
      const { data: publicUrlData, error: publicUrlError } = supabase.storage.from('Images').getPublicUrl(`public/${folder}/${file.name}`);
      
      if (publicUrlError) {
        console.error(`Error getting public URL for file ${file.name}:`, publicUrlError.message);
        continue;
      }

      images.push({
        ...file,
        folder,
        url: publicUrlData.publicUrl, // Just return the public URL
      });
    }
  }

  // Cache the images in-memory using node-cache
  cache.set('images', images);

  // Set cache headers for CDN caching
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=59');

  return res.status(200).json(images);
}
