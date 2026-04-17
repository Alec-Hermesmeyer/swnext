-- Run in Supabase SQL Editor: adds a daily field-report log so the office
-- can see what actually happened on each job each day (hours, piers, weather
-- stops, delays, notes). Complements crew_assignments (which captures plan)
-- with actuals (which capture reality), and feeds the Job Costs analytics.

CREATE TABLE IF NOT EXISTS public.crew_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.crew_schedules (id) ON DELETE SET NULL,
  job_id UUID NOT NULL REFERENCES public.crew_jobs (id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  crew_size INTEGER,
  crew_hours NUMERIC(5, 2),
  piers_drilled INTEGER,
  weather_stop BOOLEAN NOT NULL DEFAULT false,
  weather_notes TEXT,
  delays TEXT,
  notes TEXT,
  photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One canonical report per (job, date); admins can edit rather than duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS crew_daily_reports_job_date_key
  ON public.crew_daily_reports (job_id, report_date);

CREATE INDEX IF NOT EXISTS crew_daily_reports_date_idx
  ON public.crew_daily_reports (report_date DESC);

CREATE INDEX IF NOT EXISTS crew_daily_reports_schedule_idx
  ON public.crew_daily_reports (schedule_id);

-- Auto-maintain updated_at
CREATE OR REPLACE FUNCTION public.touch_crew_daily_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crew_daily_reports_set_updated_at ON public.crew_daily_reports;
CREATE TRIGGER crew_daily_reports_set_updated_at
  BEFORE UPDATE ON public.crew_daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_crew_daily_reports_updated_at();

COMMENT ON TABLE public.crew_daily_reports IS 'End-of-day field report per job: captures actual crew hours, piers drilled, weather stops, delays, and photos.';
COMMENT ON COLUMN public.crew_daily_reports.crew_size IS 'Number of crew members on the job that day';
COMMENT ON COLUMN public.crew_daily_reports.crew_hours IS 'Hours the crew worked that day (e.g., 10.0)';
COMMENT ON COLUMN public.crew_daily_reports.piers_drilled IS 'Piers completed that day (pier-drilling specific)';
COMMENT ON COLUMN public.crew_daily_reports.weather_stop IS 'True if weather caused a partial/full stop';
COMMENT ON COLUMN public.crew_daily_reports.photo_urls IS 'Array of public photo URLs (stored in Supabase storage or external)';
