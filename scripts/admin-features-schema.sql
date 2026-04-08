-- Run in the Supabase SQL Editor.
-- Creates the admin_features table that drives the Solutions feature slider.
-- Safe to run multiple times (idempotent).

CREATE TABLE IF NOT EXISTS public.admin_features (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text        NOT NULL UNIQUE,
  title       text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  priority    text        NOT NULL DEFAULT 'support'
                          CHECK (priority IN ('primary', 'secondary', 'support')),
  href        text        NOT NULL DEFAULT '',
  icon        text        NOT NULL DEFAULT 'layout',
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'coming_soon', 'beta', 'hidden')),
  sort_order  integer     NOT NULL DEFAULT 100,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.admin_features IS 'Data-driven feature catalog for the admin Solutions slider.';
COMMENT ON COLUMN public.admin_features.slug IS 'URL-safe identifier (e.g. crew-scheduler).';
COMMENT ON COLUMN public.admin_features.priority IS 'Display tier: primary, secondary, support.';
COMMENT ON COLUMN public.admin_features.icon IS 'Lucide icon name rendered in the slider card.';
COMMENT ON COLUMN public.admin_features.status IS 'active = live, coming_soon = teaser, beta = early access, hidden = not shown.';
COMMENT ON COLUMN public.admin_features.sort_order IS 'Lower numbers appear first in the slider.';

CREATE INDEX IF NOT EXISTS idx_admin_features_status_sort
  ON public.admin_features (status, sort_order);

-- Seed the initial feature set
INSERT INTO public.admin_features (slug, title, description, priority, href, icon, status, sort_order)
VALUES
  ('crew-scheduler', 'Crew Scheduler', 'Three-stage job flow from intake to detail to scheduling and packet automation.', 'primary', '/admin/crew-scheduler', 'hard-hat', 'active', 10),
  ('social-media',   'Social Media',   'Draft, plan, and shape content from live company context with AI-powered brand voice.', 'secondary', '/admin/social-media', 'megaphone', 'active', 20),
  ('careers',        'Careers',        'Create and update job listings faster from the assistant.', 'support', '/admin/careers', 'briefcase', 'active', 30),
  ('contacts',       'Contacts',       'Keep internal listings accurate and easy to manage.', 'support', '/admin/company-contacts', 'users', 'active', 40),
  ('submissions',    'Submissions',    'Review new lead and application intake without hunting for it.', 'support', '/admin/contact', 'inbox', 'active', 50),
  ('page-images',    'Page Images',    'Feed image-driven workflows and content generation.', 'support', '/admin/image-assignments', 'image', 'active', 60),
  ('sales',          'Sales',          'Surface deal context when the assistant needs business history.', 'support', '/admin/sales', 'trending-up', 'active', 70),
  ('ai-assistant',   'AI Assistant',   'Ask anything about your operations — the assistant reads live data and builds working surfaces.', 'primary', '/admin/assistant', 'bot', 'active', 5),
  ('daily-packets',  'Daily Packets',  'Auto-generated crew packets with job details, contacts, and printable cover sheets.', 'primary', '/admin/crew-scheduler', 'file-text', 'active', 15)
ON CONFLICT (slug) DO UPDATE SET
  title       = EXCLUDED.title,
  description = EXCLUDED.description,
  priority    = EXCLUDED.priority,
  href        = EXCLUDED.href,
  icon        = EXCLUDED.icon,
  status      = EXCLUDED.status,
  sort_order  = EXCLUDED.sort_order,
  updated_at  = now();

-- RLS — readable by any authenticated user, writable only by service role
ALTER TABLE public.admin_features ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read features"
    ON public.admin_features FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
