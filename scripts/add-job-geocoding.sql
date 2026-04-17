-- Run in Supabase SQL Editor: adds geocoded coordinates to crew_jobs so the
-- weather integration on the Daily Board can fetch real forecasts per job
-- site. Populated automatically by /api/weather/daily-board the first time
-- a job is viewed; persisted so subsequent loads are fast.

ALTER TABLE public.crew_jobs
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS geocode_label TEXT;

CREATE INDEX IF NOT EXISTS crew_jobs_latlon_idx
  ON public.crew_jobs (latitude, longitude);

COMMENT ON COLUMN public.crew_jobs.latitude IS 'Geocoded latitude (auto-populated from address on first weather lookup)';
COMMENT ON COLUMN public.crew_jobs.longitude IS 'Geocoded longitude (auto-populated from address on first weather lookup)';
COMMENT ON COLUMN public.crew_jobs.geocoded_at IS 'When the coordinates were last resolved; re-geocode if address changes.';
COMMENT ON COLUMN public.crew_jobs.geocode_label IS 'Friendly label returned by the geocoder (e.g., "Dallas, TX")';
