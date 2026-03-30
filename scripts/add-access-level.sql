-- Run this in the Supabase SQL Editor to add access_level to profiles.
-- Default is 3 (Lead/full access) so existing users are unaffected.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_level integer NOT NULL DEFAULT 3;
