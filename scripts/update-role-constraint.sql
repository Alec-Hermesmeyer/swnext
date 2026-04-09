-- Run this in the Supabase SQL Editor to allow the current role set.
-- Drops the old constraint and recreates it with all supported roles.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'owner', 'operations', 'safety', 'social_media', 'hr', 'sales', 'viewer', ''));
