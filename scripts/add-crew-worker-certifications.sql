-- Run in Supabase SQL Editor: adds certification/credential tracking per
-- worker so the office can see OSHA, DOT medical, CDL, DigTess, etc. that
-- are approaching expiration before they become a compliance incident on
-- a job site.

CREATE TABLE IF NOT EXISTS public.crew_worker_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.crew_workers (id) ON DELETE CASCADE,
  cert_type TEXT NOT NULL,
  cert_number TEXT,
  issuer TEXT,
  issued_date DATE,
  expires_date DATE,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crew_worker_certifications_worker_idx
  ON public.crew_worker_certifications (worker_id);

CREATE INDEX IF NOT EXISTS crew_worker_certifications_expires_idx
  ON public.crew_worker_certifications (expires_date);

CREATE OR REPLACE FUNCTION public.touch_crew_worker_certifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crew_worker_certifications_set_updated_at ON public.crew_worker_certifications;
CREATE TRIGGER crew_worker_certifications_set_updated_at
  BEFORE UPDATE ON public.crew_worker_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_crew_worker_certifications_updated_at();

COMMENT ON TABLE public.crew_worker_certifications IS 'Credentials/certs per worker (OSHA, DOT medical, CDL, DigTess, etc.) with expiration tracking.';
COMMENT ON COLUMN public.crew_worker_certifications.cert_type IS 'Cert label — e.g., "OSHA 30", "DOT Medical", "CDL-A", "DigTess", "First Aid/CPR"';
COMMENT ON COLUMN public.crew_worker_certifications.expires_date IS 'Expiration date; NULL for certs that do not expire';
COMMENT ON COLUMN public.crew_worker_certifications.document_url IS 'Public URL to scanned card/certificate (optional)';
