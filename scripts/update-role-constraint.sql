-- Run this in the Supabase SQL Editor to allow the new "safety" role.
-- Drops the old constraint and recreates with all 7 roles.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'operations', 'safety', 'social_media', 'hr', 'sales', 'viewer', ''));
