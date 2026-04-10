-- Run in Supabase SQL Editor: sales pipeline (pre-award opportunities / bids).
-- Tracks opportunities separately from the historical "Customer" / won-jobs table.

CREATE TABLE IF NOT EXISTS public.sales_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  stage TEXT NOT NULL DEFAULT 'qualify'
    CHECK (stage IN ('qualify', 'pursuing', 'quoted', 'negotiation', 'won', 'lost')),
  value_estimate NUMERIC(14, 2),
  bid_due DATE,
  next_follow_up DATE,
  owner_name TEXT,
  notes TEXT,
  lost_reason TEXT,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_opportunities_stage_idx ON public.sales_opportunities (stage);
CREATE INDEX IF NOT EXISTS sales_opportunities_next_follow_up_idx ON public.sales_opportunities (next_follow_up);
CREATE INDEX IF NOT EXISTS sales_opportunities_created_at_idx ON public.sales_opportunities (created_at DESC);

CREATE OR REPLACE FUNCTION public.sales_opportunities_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sales_opportunities_updated_at ON public.sales_opportunities;
CREATE TRIGGER sales_opportunities_updated_at
  BEFORE UPDATE ON public.sales_opportunities
  FOR EACH ROW
  EXECUTE PROCEDURE public.sales_opportunities_set_updated_at();

COMMENT ON TABLE public.sales_opportunities IS 'Pre-award bid/opportunity tracking for the sales team.';

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales_opportunities TO authenticated;
GRANT ALL ON TABLE public.sales_opportunities TO service_role;

-- Optional: ENABLE ROW LEVEL SECURITY and add policies if you query this table with the anon key from the browser.
-- The Next.js API route uses the service role key and bypasses RLS when that key is set.
