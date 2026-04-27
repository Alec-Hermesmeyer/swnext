-- Run in Supabase SQL Editor: removes the demo portal and all associated
-- demo data seeded by scripts/seed-demo-portal.sql. Safe to run anytime.

BEGIN;

-- crew_jobs CASCADE deletes:
--   crew_assignments, change_orders, crew_daily_reports,
--   portal_job_links, portal_documents (where job_id references the job)
DELETE FROM public.crew_jobs WHERE job_name LIKE '[DEMO]%';

-- client_portals CASCADE deletes:
--   portal_job_links, portal_documents (where portal_id references it)
DELETE FROM public.client_portals WHERE access_token = 'demo';

COMMIT;
