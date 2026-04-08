-- Run this in the Supabase SQL Editor to set up proper chat history storage.
-- This migration:
--   1. Creates chat_threads for thread-level metadata (title, timestamps)
--   2. Adds a proper user_id column to chat_messages (migrates from metadata)
--   3. Backfills both tables from existing data
--   4. Creates indexes for fast lookups
--   5. Adds an auto-update trigger for thread timestamps
--   6. Configures RLS policies
--
-- Safe to run multiple times (all statements are idempotent).

-- ============================================================
-- 1. chat_threads — one row per conversation session
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  text        NOT NULL UNIQUE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'New conversation',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.chat_threads IS 'Thread-level metadata for the admin assistant chat.';
COMMENT ON COLUMN public.chat_threads.session_id IS 'Client-generated session ID (e.g. assistant-1712345678-abc123).';
COMMENT ON COLUMN public.chat_threads.user_id IS 'Owner — references auth.users.';
COMMENT ON COLUMN public.chat_threads.title IS 'Derived from the first user message in the thread.';

-- ============================================================
-- 2. chat_messages — add proper user_id column
-- ============================================================

-- Add user_id as a real column (previously buried in metadata->>user_id)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key to chat_threads (nullable — existing rows get backfilled below)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.chat_threads(id) ON DELETE CASCADE;

-- ============================================================
-- 3. Backfill existing data
-- ============================================================

-- 3a. Backfill user_id on chat_messages from metadata
UPDATE public.chat_messages
SET    user_id = (metadata ->> 'user_id')::uuid
WHERE  user_id IS NULL
  AND  metadata ->> 'user_id' IS NOT NULL;

-- 3b. Backfill chat_threads from existing sessions
INSERT INTO public.chat_threads (session_id, user_id, title, created_at, updated_at)
SELECT
  sub.session_id,
  sub.user_id,
  sub.title,
  sub.first_at,
  sub.last_at
FROM (
  SELECT DISTINCT ON (cm.session_id)
    cm.session_id,
    (cm.metadata ->> 'user_id')::uuid AS user_id,
    COALESCE(
      (SELECT m2.content
       FROM   public.chat_messages m2
       WHERE  m2.session_id = cm.session_id AND m2.role = 'user'
       ORDER  BY m2.created_at ASC
       LIMIT  1),
      'New conversation'
    ) AS title,
    (SELECT MIN(m3.created_at) FROM public.chat_messages m3 WHERE m3.session_id = cm.session_id) AS first_at,
    (SELECT MAX(m4.created_at) FROM public.chat_messages m4 WHERE m4.session_id = cm.session_id) AS last_at
  FROM public.chat_messages cm
  WHERE cm.metadata ->> 'user_id' IS NOT NULL
  ORDER BY cm.session_id, cm.created_at ASC
) sub
WHERE sub.user_id IS NOT NULL
ON CONFLICT (session_id) DO UPDATE
  SET updated_at = EXCLUDED.updated_at,
      title      = EXCLUDED.title;

-- 3c. Backfill thread_id on chat_messages
UPDATE public.chat_messages cm
SET    thread_id = ct.id
FROM   public.chat_threads ct
WHERE  cm.session_id = ct.session_id
  AND  cm.thread_id IS NULL;

-- ============================================================
-- 4. Indexes
-- ============================================================

-- chat_threads
CREATE INDEX IF NOT EXISTS idx_chat_threads_user_id
  ON public.chat_threads (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_threads_user_updated
  ON public.chat_threads (user_id, updated_at DESC);

-- chat_messages — primary query paths
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id
  ON public.chat_messages (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON public.chat_messages (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id
  ON public.chat_messages (thread_id);

-- GIN index on metadata for the assistantProfile / user_id JSONB filters
-- used by team-insights, rag-backfill, and session recovery.
CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata_gin
  ON public.chat_messages USING gin (metadata jsonb_path_ops);

-- ============================================================
-- 5. Auto-update chat_threads.updated_at on new messages
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_chat_thread_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.chat_threads
  SET    updated_at = now()
  WHERE  session_id = NEW.session_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_message_update_thread ON public.chat_messages;

CREATE TRIGGER trg_chat_message_update_thread
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_thread_timestamp();

-- ============================================================
-- 6. Auto-create chat_threads row on first message insert
-- ============================================================

CREATE OR REPLACE FUNCTION public.ensure_chat_thread_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.chat_threads (session_id, user_id, title)
  VALUES (
    NEW.session_id,
    COALESCE(NEW.user_id, (NEW.metadata ->> 'user_id')::uuid),
    CASE WHEN NEW.role = 'user' THEN left(NEW.content, 80) ELSE 'New conversation' END
  )
  ON CONFLICT (session_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_message_ensure_thread ON public.chat_messages;

CREATE TRIGGER trg_chat_message_ensure_thread
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_chat_thread_exists();

-- ============================================================
-- 7. Auto-populate user_id column from metadata on insert
-- ============================================================

CREATE OR REPLACE FUNCTION public.populate_chat_message_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.metadata ->> 'user_id' IS NOT NULL THEN
    NEW.user_id := (NEW.metadata ->> 'user_id')::uuid;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_message_populate_user ON public.chat_messages;

CREATE TRIGGER trg_chat_message_populate_user
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_chat_message_user_id();

-- ============================================================
-- 8. RLS policies
-- ============================================================

ALTER TABLE public.chat_threads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_threads policies
DO $$ BEGIN
  CREATE POLICY "Users read own threads"
    ON public.chat_threads FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert own threads"
    ON public.chat_threads FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users delete own threads"
    ON public.chat_threads FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own threads"
    ON public.chat_threads FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- chat_messages policies
DO $$ BEGIN
  CREATE POLICY "Users read own messages"
    ON public.chat_messages FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert own messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users delete own messages"
    ON public.chat_messages FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- NOTE: The API routes use the service-role key which bypasses RLS.
-- These policies protect direct client-side access via the anon key.
