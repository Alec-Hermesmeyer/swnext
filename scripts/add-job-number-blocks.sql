-- Run in Supabase SQL Editor: introduces S&W's job-number scheme as data so
-- the app can auto-assign the next number when a user creates a job.
--
-- Scheme (from docs/2026Jobs.txt):
--   Format:  YY/NNNN   (e.g., "26/0120")
--   Blocks:  Each customer gets a reserved range.
--            - Dedicated blocks for volume customers: "26/0120 - 26/0199  Archer Western"
--            - "Misc {Letter}'s" shared blocks for low-volume customers whose
--              hiring-contractor name starts with that letter (Misc A's, B's, etc.)

CREATE TABLE IF NOT EXISTS public.job_number_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_prefix TEXT NOT NULL,          -- "26" for 2026
  start_num INTEGER NOT NULL,         -- e.g., 120
  end_num INTEGER NOT NULL,           -- e.g., 199
  block_owner TEXT NOT NULL,          -- "Archer Western" or "Misc A's"
  is_misc BOOLEAN NOT NULL DEFAULT false,
  misc_letter TEXT,                   -- "A", "B", ... for misc blocks; NULL for dedicated
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT job_number_blocks_range_ck CHECK (end_num >= start_num),
  CONSTRAINT job_number_blocks_unique UNIQUE (year_prefix, start_num, end_num)
);

CREATE INDEX IF NOT EXISTS job_number_blocks_year_idx
  ON public.job_number_blocks (year_prefix);
CREATE INDEX IF NOT EXISTS job_number_blocks_owner_lower_idx
  ON public.job_number_blocks (lower(block_owner));
CREATE INDEX IF NOT EXISTS job_number_blocks_misc_letter_idx
  ON public.job_number_blocks (misc_letter) WHERE is_misc;

CREATE OR REPLACE FUNCTION public.touch_job_number_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_number_blocks_set_updated_at ON public.job_number_blocks;
CREATE TRIGGER job_number_blocks_set_updated_at
  BEFORE UPDATE ON public.job_number_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_job_number_blocks_updated_at();

COMMENT ON TABLE public.job_number_blocks IS 'Reserved job-number ranges per customer (S&W scheme). Drives auto-assignment of the next YY/NNNN when a job is created.';
COMMENT ON COLUMN public.job_number_blocks.block_owner IS 'Exact customer/GC name for dedicated blocks, or "Misc X''s" for shared letter blocks';
COMMENT ON COLUMN public.job_number_blocks.misc_letter IS 'Uppercase letter A–Z when this is a shared Misc block; used to fall back when no dedicated block matches';
