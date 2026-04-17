-- Run in Supabase SQL Editor: adds change-order tracking per job so scope
-- additions/deletions don't get lost in verbal agreements. Captures the
-- full lifecycle: pending → submitted → approved/rejected → invoiced.
-- Feeds the Job Costs view (adjusted contract total = contract + approved COs).

CREATE TABLE IF NOT EXISTS public.change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.crew_jobs (id) ON DELETE CASCADE,
  co_number TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'invoiced')),
  requested_by TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  customer_signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS change_orders_job_idx
  ON public.change_orders (job_id);

CREATE INDEX IF NOT EXISTS change_orders_status_idx
  ON public.change_orders (status);

CREATE INDEX IF NOT EXISTS change_orders_requested_at_idx
  ON public.change_orders (requested_at DESC);

CREATE OR REPLACE FUNCTION public.touch_change_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS change_orders_set_updated_at ON public.change_orders;
CREATE TRIGGER change_orders_set_updated_at
  BEFORE UPDATE ON public.change_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_change_orders_updated_at();

COMMENT ON TABLE public.change_orders IS 'Change orders per job — scope additions/deletions with approval workflow. Approved COs adjust the job contract total.';
COMMENT ON COLUMN public.change_orders.co_number IS 'Human-readable CO number (e.g., "CO-001"). Unique per job by convention.';
COMMENT ON COLUMN public.change_orders.amount IS 'Dollar amount of the change. Positive = addition, negative = deduction.';
COMMENT ON COLUMN public.change_orders.status IS 'Lifecycle: pending, submitted (sent to GC), approved, rejected, invoiced.';
