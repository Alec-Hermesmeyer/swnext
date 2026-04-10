-- Run in Supabase SQL Editor: expand crew_jobs for duration, financial,
-- and sales-pipeline tracking so the data loop is ready when sales comes online.

-- ── Duration & mobilization tracking on crew_jobs ──
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS estimated_days INTEGER;
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS actual_days INTEGER;
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS mob_days INTEGER;
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS actual_mob_days INTEGER;

-- ── Financial fields ──
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS bid_amount NUMERIC(14, 2);
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS contract_amount NUMERIC(14, 2);

-- ── Scope metrics (pier drilling specific) ──
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS pier_count INTEGER;
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS scope_description TEXT;

-- ── Job lifecycle status (richer than boolean is_active) ──
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS job_status TEXT DEFAULT 'active'
  CHECK (job_status IN ('bid', 'awarded', 'scheduled', 'in_progress', 'completed', 'on_hold', 'active'));

-- ── Link to sales pipeline (which bid became this job) ──
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS sales_opportunity_id UUID
  REFERENCES public.sales_opportunities (id) ON DELETE SET NULL;

-- ── Actual date tracking for completed jobs ──
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.crew_jobs ADD COLUMN IF NOT EXISTS end_date DATE;

-- ── Indexes for reporting/analytics ──
CREATE INDEX IF NOT EXISTS idx_crew_jobs_status ON public.crew_jobs (job_status);
CREATE INDEX IF NOT EXISTS idx_crew_jobs_sales_opp ON public.crew_jobs (sales_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crew_jobs_start_date ON public.crew_jobs (start_date);
CREATE INDEX IF NOT EXISTS idx_crew_jobs_customer ON public.crew_jobs (customer_name);

-- ── Backfill: link to sales pipeline from crew_jobs ──
ALTER TABLE public.sales_opportunities ADD COLUMN IF NOT EXISTS crew_job_id UUID
  REFERENCES public.crew_jobs (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sales_opportunities_crew_job_id_idx ON public.sales_opportunities (crew_job_id);

COMMENT ON COLUMN public.crew_jobs.estimated_days IS 'Estimated working days for the job (excludes mob)';
COMMENT ON COLUMN public.crew_jobs.actual_days IS 'Actual working days when job completes';
COMMENT ON COLUMN public.crew_jobs.mob_days IS 'Estimated mobilization days';
COMMENT ON COLUMN public.crew_jobs.actual_mob_days IS 'Actual mobilization days when job completes';
COMMENT ON COLUMN public.crew_jobs.bid_amount IS 'Original bid amount in dollars';
COMMENT ON COLUMN public.crew_jobs.contract_amount IS 'Final contract/award amount in dollars';
COMMENT ON COLUMN public.crew_jobs.pier_count IS 'Number of piers in scope';
COMMENT ON COLUMN public.crew_jobs.scope_description IS 'Brief scope summary for the job';
COMMENT ON COLUMN public.crew_jobs.job_status IS 'Lifecycle stage: bid, awarded, scheduled, in_progress, completed, on_hold, active';
COMMENT ON COLUMN public.crew_jobs.sales_opportunity_id IS 'FK to sales_opportunities — which bid became this job';
COMMENT ON COLUMN public.crew_jobs.start_date IS 'Actual job start date';
COMMENT ON COLUMN public.crew_jobs.end_date IS 'Actual job completion date';
COMMENT ON COLUMN public.sales_opportunities.crew_job_id IS 'FK to crew_jobs — the job created when this opportunity was won';
