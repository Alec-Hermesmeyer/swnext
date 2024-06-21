import { createClient } from '@supabase/supabase-js';
import NodeCache from 'node-cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const cache = new NodeCache({ stdTTL: 3600 });

export default async function handler(req, res) {
  const cachedImages = cache.get('images');

  if (cachedImages) {
    console.log('Serving images from cache');
    return res.status(200).json(cachedImages);
  }
  console.log('Fetching images from Supabase');
  const folders = ['newimages', 'galleryImages']; // Subfolders inside 'public'
  let images = [];

  for (const folder of folders) {
    const { data, error } = await supabase
      .storage
      .from('Images')
      .list(`public/${folder}`, { limit: 100 });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    images = [...images, ...data.map(file => ({ ...file, folder }))];
  }

  cache.set('images', images);

  res.status(200).json(images);
}
