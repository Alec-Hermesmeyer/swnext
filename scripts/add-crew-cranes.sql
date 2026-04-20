-- Run in Supabase SQL Editor: adds structured crane tracking so cranes
-- get first-class treatment like rigs and trucks — with a default operator
-- and oiler from crew_workers. Scope will expand once the field team
-- tells us what else they need per crane.

CREATE TABLE IF NOT EXISTS public.crew_cranes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit_number TEXT,
  make TEXT,
  model TEXT,
  capacity TEXT,
  default_operator_id UUID REFERENCES public.crew_workers (id) ON DELETE SET NULL,
  default_oiler_id UUID REFERENCES public.crew_workers (id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crew_cranes_active_idx
  ON public.crew_cranes (is_active);

CREATE INDEX IF NOT EXISTS crew_cranes_operator_idx
  ON public.crew_cranes (default_operator_id);

CREATE OR REPLACE FUNCTION public.touch_crew_cranes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crew_cranes_set_updated_at ON public.crew_cranes;
CREATE TRIGGER crew_cranes_set_updated_at
  BEFORE UPDATE ON public.crew_cranes
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_crew_cranes_updated_at();

COMMENT ON TABLE public.crew_cranes IS 'Structured crane inventory with default crew (operator + oiler). Complements the freeform crane_info on schedule_rig_details for per-day overrides.';
COMMENT ON COLUMN public.crew_cranes.name IS 'Friendly label — e.g., "Link-Belt 138", "Crane 1"';
COMMENT ON COLUMN public.crew_cranes.unit_number IS 'Asset / unit number as painted on the crane';
COMMENT ON COLUMN public.crew_cranes.capacity IS 'Rated capacity, free-text — e.g., "70-ton", "138,000 lb"';
