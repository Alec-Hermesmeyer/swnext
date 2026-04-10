-- Run in Supabase SQL Editor after create-sales-opportunities.sql
-- 1) Sales pipeline: owner for visibility by access level
-- 2) Hiring pipeline: job applicants (HR — not sales)

ALTER TABLE public.sales_opportunities
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL;

UPDATE public.sales_opportunities
SET owner_user_id = created_by
WHERE owner_user_id IS NULL AND created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS sales_opportunities_owner_user_id_idx ON public.sales_opportunities (owner_user_id);

-- ── Hiring (HR) pipeline — separate from sales ──

CREATE TABLE IF NOT EXISTS public.hiring_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  applicant_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  position_applied TEXT,
  stage TEXT NOT NULL DEFAULT 'new'
    CHECK (stage IN ('new', 'reviewing', 'interview', 'offer', 'hired', 'declined')),
  next_follow_up DATE,
  notes TEXT,
  decline_reason TEXT,
  source_job_submission_id UUID,
  owner_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hiring_opportunities_stage_idx ON public.hiring_opportunities (stage);
CREATE INDEX IF NOT EXISTS hiring_opportunities_created_at_idx ON public.hiring_opportunities (created_at DESC);

DROP TRIGGER IF EXISTS hiring_opportunities_updated_at ON public.hiring_opportunities;
CREATE TRIGGER hiring_opportunities_updated_at
  BEFORE UPDATE ON public.hiring_opportunities
  FOR EACH ROW
  EXECUTE PROCEDURE public.sales_opportunities_set_updated_at();

COMMENT ON TABLE public.hiring_opportunities IS 'HR hiring pipeline for job applicants — not used by sales.';

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hiring_opportunities TO authenticated;
GRANT ALL ON TABLE public.hiring_opportunities TO service_role;
