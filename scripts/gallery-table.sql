-- Run this in the Supabase SQL Editor to create the gallery_images table.
-- After running, the API will auto-seed it with the existing hardcoded images.

CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  filename text NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  title text,
  description text,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Allow public reads (gallery page is public)
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON gallery_images
  FOR SELECT USING (true);

CREATE POLICY "Service role write" ON gallery_images
  FOR ALL USING (true);
