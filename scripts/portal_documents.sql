CREATE TABLE IF NOT EXISTS portal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id UUID NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  job_id UUID REFERENCES crew_jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT DEFAULT 'other',
  document_source TEXT DEFAULT 'upload',
  bid_document_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portal_documents_portal ON portal_documents(portal_id);
