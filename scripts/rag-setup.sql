-- Run this in the Supabase SQL Editor to set up the RAG knowledge base.

-- 1. Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  source text,
  category text,
  file_path text,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. HNSW index — works on empty tables (IVFFlat does not)
CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents USING hnsw (embedding vector_cosine_ops);

-- 4. Similarity search function
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

-- 5. RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read documents" ON documents FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service write documents" ON documents FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Create a storage bucket for uploaded knowledge base files
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', false)
ON CONFLICT (id) DO NOTHING;
