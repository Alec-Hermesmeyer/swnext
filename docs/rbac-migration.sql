-- RBAC Migration: Standardize profiles.role column
-- Run this against your Supabase database to enforce valid role values.

-- Step 1: Backfill any non-standard role values to 'viewer'
UPDATE public.profiles
  SET role = 'viewer'
  WHERE role IS NOT NULL
    AND role NOT IN ('admin', 'owner', 'operations', 'safety', 'social_media', 'hr', 'sales', 'viewer');

-- Step 2: Add CHECK constraint to prevent invalid roles going forward
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('admin', 'owner', 'operations', 'safety', 'social_media', 'hr', 'sales', 'viewer'));

-- Step 3: Create index on role for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);   
