import supabase from '@/components/Supabase'; // Assuming your Supabase client is set up here

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Fetch all job postings
    const { data, error } = await supabase.from('jobs').select('*');
    if (error) {
      return res.status(500).json({ message: 'Error fetching job postings', error });
    }
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { jobTitle, jobDesc, is_Open } = req.body;
    const { data, error } = await supabase.from('jobs').insert([{ jobTitle, jobDesc, is_Open }]);

    if (error) {
      return res.status(500).json({ message: 'Error adding job', error });
    }

    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const { id, is_Open } = req.body;
    const { data, error } = await supabase
      .from('jobs')
      .update({ is_Open })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Error updating job', error });
    }

    return res.status(200).json(data);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}