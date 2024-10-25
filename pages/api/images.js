import supabase from '@/components/Supabase';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Fetch images from the Supabase bucket
    const { data, error } = await supabase.storage.from('Images').list('public', {
      limit: 100, // Adjust the limit if needed
      sortBy: { column: 'name', order: 'asc' },
    });
    // console.log('Fetched images:', data);

    if (error) {
      console.error("Error fetching images:", error);
      return res.status(500).json({ message: 'Error fetching images', error });
    }

    // Generate public URLs for each image
    const images = data.map((file) => {
      // Ensure you're constructing the full path relative to the bucket
      const { publicURL } = supabase.storage.from('Images').getPublicUrl(`Images/public/${file.name}`);
      return {
        name: file.name,
        url: publicURL, // This should now return the correct public URL
      };
    });
    
    
    // Return the image list as JSON
    return res.status(200).json(images);
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ message: 'Unexpected error occurred', error: err.message });
  }
}
