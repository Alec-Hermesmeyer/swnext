-- Run in Supabase SQL Editor: adds a junction table for explicit
-- portal-to-job associations. Works alongside the existing ILIKE
-- name-matching — linked jobs appear in the portal even when the
-- customer_name / hiring_contractor doesn't match.

CREATE TABLE IF NOT EXISTS public.portal_job_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.crew_jobs(id) ON DELETE CASCADE,
  linked_by TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portal_job_links_unique UNIQUE (portal_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_portal_job_links_portal
  ON public.portal_job_links (portal_id);

CREATE INDEX IF NOT EXISTS idx_portal_job_links_job
  ON public.portal_job_links (job_id);

COMMENT ON TABLE public.portal_job_links IS 'Explicit many-to-many links between client portals and crew jobs. Supplements the automatic ILIKE name-matching with manual overrides.';
COMMENT ON COLUMN public.portal_job_links.linked_by IS 'Email or name of the admin who created the link (optional audit trail).';
