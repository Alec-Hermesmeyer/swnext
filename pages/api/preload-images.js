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
    return cachePath;
  }

  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(cachePath, response.data);
  return cachePath;
}

export default async function handler(req, res) {
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
      return res.status(500).json({ error: error.message });
    }

    for (const file of data) {
      const publicUrl = supabase.storage.from('Images').getPublicUrl(`public/${folder}/${file.name}`).data.publicUrl;
      const cachedPath = await downloadAndCacheImage(publicUrl, `${folder}_${file.name}`);
      
      images.push({
        ...file,
        folder,
        url: `/api/cached-image?path=${encodeURIComponent(cachedPath)}`
      });
    }
  }

  cache.set('images', images);

  res.status(200).json(images);
}
