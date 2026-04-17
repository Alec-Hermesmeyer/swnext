-- Run in Supabase SQL Editor: adds client-portal access so GCs/owners can
-- view their own jobs (status, progress, change orders, recent field activity)
-- via a tokenized URL — no GC signup required. One portal per customer; it
-- auto-lists every crew_job whose customer_name or hiring_contractor matches
-- the portal's match_name.

CREATE TABLE IF NOT EXISTS public.client_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  match_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  access_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_portals_token_idx
  ON public.client_portals (access_token);

CREATE INDEX IF NOT EXISTS client_portals_match_name_idx
  ON public.client_portals (lower(match_name));

CREATE INDEX IF NOT EXISTS client_portals_active_idx
  ON public.client_portals (is_active);

CREATE OR REPLACE FUNCTION public.touch_client_portals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS client_portals_set_updated_at ON public.client_portals;
CREATE TRIGGER client_portals_set_updated_at
  BEFORE UPDATE ON public.client_portals
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_client_portals_updated_at();

COMMENT ON TABLE public.client_portals IS 'Tokenized client-portal access. One portal per GC/customer; maps to crew_jobs via match_name against customer_name or hiring_contractor.';
COMMENT ON COLUMN public.client_portals.label IS 'Display label shown to the client (e.g., "Acme GC Portal")';
COMMENT ON COLUMN public.client_portals.match_name IS 'Exact string matched against crew_jobs.customer_name OR crew_jobs.hiring_contractor (case-insensitive)';
COMMENT ON COLUMN public.client_portals.access_token IS 'URL-safe random token (32+ chars). Used in /project/[token] URLs.';
