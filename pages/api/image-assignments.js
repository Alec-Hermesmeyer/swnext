import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Fetch all image assignments
    const { data, error } = await supabase
      .from('image_assignments')
      .select('*')
      .order('page', { ascending: true });

    if (error) {
      // Table might not exist yet, return empty
      return res.status(200).json({ assignments: {} });
    }

    // Convert array to object keyed by slot
    const assignments = {};
    data?.forEach(row => {
      assignments[`${row.page}.${row.slot}`] = row.image_url;
    });

    return res.status(200).json({ assignments });
  }

  if (req.method === 'POST') {
    const { page, slot, image_url } = req.body;

    if (!page || !slot || !image_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Upsert the assignment
    const { error } = await supabase
      .from('image_assignments')
      .upsert(
        { page, slot, image_url, updated_at: new Date().toISOString() },
        { onConflict: 'page,slot' }
      );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { page, slot } = req.body;

    const { error } = await supabase
      .from('image_assignments')
      .delete()
      .eq('page', page)
      .eq('slot', slot);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
