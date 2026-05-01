-- Run in Supabase SQL Editor: backs the daily Jobs revenue-report pipeline.
-- Source files (.docx, one per day) land in the `revenueReports` bucket; the
-- upload API parses prose → structured rows; date-range generation produces
-- a Job Detail-format export (XLSX / DOCX) from the rows table.

-- 1. Per-upload metadata + raw text + parse status.
CREATE TABLE IF NOT EXISTS public.revenue_report_uploads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name       TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  report_date     DATE,                                 -- date the report covers (from filename or doc body)
  uploaded_by     TEXT,                                 -- email or user id; nullable for service-account uploads
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','parsed','error')),
  parse_error     TEXT,
  raw_text        TEXT,                                 -- extracted plain text, retained for re-parsing
  parser_model    TEXT,                                 -- model id used (e.g. "llama-3.3-70b-versatile")
  parsed_at       TIMESTAMPTZ,
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_revenue_report_uploads_report_date
  ON public.revenue_report_uploads (report_date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_report_uploads_status
  ON public.revenue_report_uploads (status);

-- Reconciliation columns: day_total is what the doc's "Total: $X" line says,
-- parsed_revenue_sum is what we computed from the per-job rows. The UI
-- compares the two and shows a red badge when they disagree, so the user can
-- see at a glance which uploads need a manual fix-up.
ALTER TABLE public.revenue_report_uploads
  ADD COLUMN IF NOT EXISTS day_total NUMERIC(12,2);
ALTER TABLE public.revenue_report_uploads
  ADD COLUMN IF NOT EXISTS parsed_revenue_sum NUMERIC(12,2);

-- 2. Structured per-job rows. One row per (date, job) pair, either extracted
-- from a daily upload OR entered manually via the admin UI (in which case
-- upload_id is NULL). This is the table the generator queries.
CREATE TABLE IF NOT EXISTS public.revenue_report_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id         UUID REFERENCES public.revenue_report_uploads(id) ON DELETE CASCADE,
  report_date       DATE NOT NULL,
  job_number        TEXT,                               -- "26/0356"
  job_name          TEXT,                               -- "Orion Victoria Service Center"
  customer_name     TEXT,
  location          TEXT,                               -- address as written
  revenue           NUMERIC(12,2),                      -- daily revenue for this job
  rig_name          TEXT,                               -- "Sany 4"
  crew_names        TEXT,                               -- comma-joined as in original
  notes             TEXT,                               -- production lines / status notes
  -- Free-form bag for the structured fields that exist in daily docs but
  -- aren't in the Job Detail layout (contract_price, price_per_hole,
  -- days_on_site, days_remaining, bid_line_items, etc.). Keeps richer
  -- reports possible later without another migration.
  extra             JSONB,
  -- "imported" = parsed from a docx upload, "manual" = entered/edited via UI.
  -- Helps the UI flag rows that came from the model vs. human-curated.
  source            TEXT NOT NULL DEFAULT 'imported'
                      CHECK (source IN ('imported','manual')),
  edited_at         TIMESTAMPTZ,                          -- set whenever a user edits a row
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent column adds for existing installs.
ALTER TABLE public.revenue_report_jobs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'imported';
ALTER TABLE public.revenue_report_jobs
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE public.revenue_report_jobs
  ALTER COLUMN upload_id DROP NOT NULL;

-- Link to the canonical crew_jobs record. Set when the parser (or the user
-- via the editor) matches a parsed row to an existing job by job_number.
-- Lets the UI show "linked to job XYZ" and lets reports overlay canonical
-- job_name / customer_name / address fields.
ALTER TABLE public.revenue_report_jobs
  ADD COLUMN IF NOT EXISTS crew_job_id UUID
    REFERENCES public.crew_jobs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_revenue_report_jobs_crew_job_id
  ON public.revenue_report_jobs (crew_job_id);

CREATE INDEX IF NOT EXISTS idx_revenue_report_jobs_report_date
  ON public.revenue_report_jobs (report_date);
CREATE INDEX IF NOT EXISTS idx_revenue_report_jobs_upload_id
  ON public.revenue_report_jobs (upload_id);
CREATE INDEX IF NOT EXISTS idx_revenue_report_jobs_job_number
  ON public.revenue_report_jobs (job_number);

-- 3. Optional uniqueness: one (upload, job#) pair per upload to prevent
-- duplicate inserts on a re-parse of the same file. Comment out if you
-- expect a single daily file to legitimately list the same job twice.
ALTER TABLE public.revenue_report_jobs
  DROP CONSTRAINT IF EXISTS uq_revenue_report_jobs_upload_job;
ALTER TABLE public.revenue_report_jobs
  ADD CONSTRAINT uq_revenue_report_jobs_upload_job
  UNIQUE (upload_id, job_number);
