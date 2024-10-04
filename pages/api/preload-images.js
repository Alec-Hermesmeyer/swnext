import NodeCache from 'node-cache';
import supabase from "@/components/Supabase";
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const cache = new NodeCache({ stdTTL: 3600 });
const CACHE_DIR = path.join(process.cwd(), 'image-cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

async function downloadAndCacheImage(url, filename) {
  const cachePath = path.join(CACHE_DIR, filename);
  
  if (fs.existsSync(cachePath)) {
    const imageData = fs.readFileSync(cachePath);
    cache.set(filename, imageData);
    return cachePath;
  }

  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(cachePath, response.data);
  cache.set(filename, response.data);
  return cachePath;
}

export default async function handler(_, res) {
  const cachedImages = cache.get('images');

  if (cachedImages) {
    console.log('Serving images from cache');
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

    console.log(`Fetched ${data.length} images from folder ${folder}`);

    for (const file of data) {
      const { data: publicUrlData, error: publicUrlError } = supabase.storage.from('Images').getPublicUrl(`public/${folder}/${file.name}`);
      
      if (publicUrlError) {
        console.error(`Error getting public URL for file ${file.name}:`, publicUrlError.message);
        continue;
      }

      const publicUrl = publicUrlData.publicUrl;
      console.log(`Processing image: ${publicUrl}`);

      
      images.push({
        ...file,
        folder,
        url: publicUrl // Store the public URL instead of the cached path
      });
    }
  }

  cache.set('images', images);

  res.status(200).json(images);
}
