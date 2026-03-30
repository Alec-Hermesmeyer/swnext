-- Run this in the Supabase SQL Editor to set up the RAG knowledge base.
-- Uses pgvector (built into Supabase) for similarity search.

-- 1. Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  source text,           -- e.g. 'crew_jobs', 'manual', 'contact_form', 'backfill'
  category text,         -- e.g. 'project_history', 'company_info', 'process', 'client'
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create an index for fast similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. Create the similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  source text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    d.source,
    d.category,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read documents" ON documents
  FOR SELECT USING (true);

CREATE POLICY "Service write documents" ON documents
  FOR ALL USING (true);
