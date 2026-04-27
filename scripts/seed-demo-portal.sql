-- Run in Supabase SQL Editor: seeds a fully-functional demo client portal
-- so the S&W team can showcase the portal experience end-to-end and demo
-- the admin lifecycle (edit label, link/unlink jobs, upload docs, toggle
-- is_active). Demo URL: /project/demo
--
-- Idempotent: re-running wipes the prior demo data and reseeds. To remove
-- entirely without reseeding, use scripts/remove-demo-portal.sql.
--
-- All jobs are prefixed "[DEMO]" so they're easy to spot in admin views,
-- and use job_numbers in the 26/9xxx range that are clear of any real
-- block. Daily reports are dated relative to today so the demo never
-- looks stale.

BEGIN;

-- ── Cleanup any existing demo data ─────────────────────────────────
-- Deleting crew_jobs cascades to: crew_assignments, change_orders,
-- crew_daily_reports, portal_job_links, portal_documents (via job_id).
-- Deleting client_portals cascades to: portal_job_links, portal_documents.
DELETE FROM public.crew_jobs WHERE job_name LIKE '[DEMO]%';
DELETE FROM public.client_portals WHERE access_token = 'demo';

-- ── Seed ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_portal_id UUID;
  v_job_hospital UUID;
  v_job_retail UUID;
  v_job_warehouse UUID;

  -- Stable Unsplash construction-site photos. Hotlinkable.
  v_photo_1 TEXT := 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80';
  v_photo_2 TEXT := 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80';
  v_photo_3 TEXT := 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=80';
  v_photo_4 TEXT := 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80';
  v_photo_5 TEXT := 'https://images.unsplash.com/photo-1590725140246-20acdee442be?w=400&q=80';
BEGIN
  -- 1. The portal itself
  INSERT INTO public.client_portals (
    label, match_name, contact_name, contact_email,
    access_token, is_active, notes
  ) VALUES (
    'Acme Construction Group (Demo)',
    'Acme Construction Group (Demo)',
    'Jane Foreman',
    'jane.foreman@example.com',
    'demo',
    true,
    'Demo portal for showcasing the client-portal experience to the S&W team. Safe to delete with scripts/remove-demo-portal.sql.'
  )
  RETURNING id INTO v_portal_id;

  -- 2. Three demo jobs spanning the lifecycle
  -- ── Job 1: in-progress hospital ────────────────────────────────
  INSERT INTO public.crew_jobs (
    job_number, job_name, customer_name, hiring_contractor,
    address, city, zip,
    contract_amount, estimated_days, mob_days, actual_days, actual_mob_days,
    start_date, end_date, pier_count, scope_description,
    job_status, is_active, default_rig, pm_name
  ) VALUES (
    '26/9001',
    '[DEMO] Mercy Regional Hospital — East Tower Foundation',
    'Acme Construction Group (Demo)',
    'Acme Construction Group (Demo)',
    '4500 N Hospital Pkwy', 'Dallas, TX', '75201',
    485000, 18, 2, 12, 2,
    CURRENT_DATE - 18, CURRENT_DATE + 8, 240,
    'Drilled pier foundation system for new 8-story east tower. 240 piers ranging 24"–36" diameter, depths 35–55 ft to engineered bearing strata.',
    'in_progress', true, 'B-58 #3', 'Mike Castillo'
  )
  RETURNING id INTO v_job_hospital;

  -- ── Job 2: scheduled retail center ─────────────────────────────
  INSERT INTO public.crew_jobs (
    job_number, job_name, customer_name, hiring_contractor,
    address, city, zip,
    contract_amount, estimated_days, mob_days, actual_days, actual_mob_days,
    start_date, end_date, pier_count, scope_description,
    job_status, is_active, default_rig, pm_name
  ) VALUES (
    '26/9002',
    '[DEMO] Northstar Retail Center — Phase II Pads',
    'Acme Construction Group (Demo)',
    'Acme Construction Group (Demo)',
    '8800 Preston Rd', 'Plano, TX', '75024',
    312000, 12, 1, 0, 0,
    CURRENT_DATE + 12, CURRENT_DATE + 26, 156,
    'Drilled pier foundations for three retail pad buildings. 156 piers, 18"–30" diameter, average depth 28 ft.',
    'scheduled', true, 'B-47 #1', 'Sarah Chen'
  )
  RETURNING id INTO v_job_retail;

  -- ── Job 3: completed warehouse ─────────────────────────────────
  INSERT INTO public.crew_jobs (
    job_number, job_name, customer_name, hiring_contractor,
    address, city, zip,
    contract_amount, estimated_days, mob_days, actual_days, actual_mob_days,
    start_date, end_date, pier_count, scope_description,
    job_status, is_active, default_rig, pm_name
  ) VALUES (
    '26/9003',
    '[DEMO] Lakeside Distribution Warehouse',
    'Acme Construction Group (Demo)',
    'Acme Construction Group (Demo)',
    '1200 Industrial Blvd', 'Fort Worth, TX', '76106',
    625000, 22, 1, 22, 1,
    CURRENT_DATE - 50, CURRENT_DATE - 28, 320,
    '650,000 sf distribution warehouse foundation. 320 piers, 24" diameter, depths 32–40 ft. Completed ahead of schedule.',
    'completed', false, 'B-58 #1', 'David Ramirez'
  )
  RETURNING id INTO v_job_warehouse;

  -- 3. Change orders
  INSERT INTO public.change_orders (job_id, co_number, description, amount, status, requested_at, approved_at) VALUES
    (v_job_hospital, 'CO-001', 'Additional 12 piers required at column line G — geotech revision after subgrade discovery.', 21500, 'approved', now() - interval '14 days', now() - interval '11 days'),
    (v_job_hospital, 'CO-002', 'Pier depth extension at piers P-118 through P-124 to reach competent bearing.', 7000, 'approved', now() - interval '9 days', now() - interval '7 days'),
    (v_job_hospital, 'CO-003', 'Additional dewatering due to rising water table on east elevation.', 12000, 'pending', now() - interval '3 days', NULL),
    (v_job_warehouse, 'CO-001', 'Additional 9 piers at expansion joint — owner-requested grid revision.', 18750, 'invoiced', now() - interval '42 days', now() - interval '40 days');

  -- 4. Daily reports — Hospital (12 entries, 1 weather stop)
  INSERT INTO public.crew_daily_reports (job_id, report_date, crew_size, crew_hours, piers_drilled, weather_stop, weather_notes, delays, photo_urls) VALUES
    (v_job_hospital, CURRENT_DATE - 1,  6, 9.5, 18, false, NULL, NULL, jsonb_build_array(v_photo_1, v_photo_2, v_photo_3)),
    (v_job_hospital, CURRENT_DATE - 2,  6, 10.0, 20, false, NULL, NULL, jsonb_build_array(v_photo_4, v_photo_5)),
    (v_job_hospital, CURRENT_DATE - 3,  5, 9.0, 16, false, NULL, NULL, jsonb_build_array(v_photo_2, v_photo_3)),
    (v_job_hospital, CURRENT_DATE - 4,  6, 10.0, 22, false, NULL, NULL, '[]'::jsonb),
    (v_job_hospital, CURRENT_DATE - 5,  6, 10.0, 19, false, NULL, NULL, jsonb_build_array(v_photo_1)),
    (v_job_hospital, CURRENT_DATE - 8,  4, 4.0,  0,  true,  'Heavy thunderstorms — site shut down 11am, crew demobilized safely.', NULL, '[]'::jsonb),
    (v_job_hospital, CURRENT_DATE - 9,  6, 10.0, 21, false, NULL, NULL, '[]'::jsonb),
    (v_job_hospital, CURRENT_DATE - 10, 6, 10.0, 20, false, NULL, NULL, jsonb_build_array(v_photo_4, v_photo_5)),
    (v_job_hospital, CURRENT_DATE - 11, 5, 9.5, 18, false, NULL, NULL, '[]'::jsonb),
    (v_job_hospital, CURRENT_DATE - 12, 6, 10.0, 17, false, NULL, NULL, jsonb_build_array(v_photo_3)),
    (v_job_hospital, CURRENT_DATE - 15, 5, 8.0, 12, false, NULL, 'Late material delivery — drilling resumed at 10:30am.', '[]'::jsonb),
    (v_job_hospital, CURRENT_DATE - 16, 4, 6.0,  8, false, NULL, 'Mobilization day — equipment staging and site walk.', '[]'::jsonb);

  -- 5. Daily reports — Warehouse (8 entries, completed)
  INSERT INTO public.crew_daily_reports (job_id, report_date, crew_size, crew_hours, piers_drilled, weather_stop, weather_notes, delays, photo_urls) VALUES
    (v_job_warehouse, CURRENT_DATE - 32, 6, 10.0, 22, false, NULL, NULL, jsonb_build_array(v_photo_1, v_photo_2)),
    (v_job_warehouse, CURRENT_DATE - 34, 6, 10.0, 24, false, NULL, NULL, '[]'::jsonb),
    (v_job_warehouse, CURRENT_DATE - 36, 6, 10.0, 21, false, NULL, NULL, jsonb_build_array(v_photo_3)),
    (v_job_warehouse, CURRENT_DATE - 38, 5, 9.5, 19, false, NULL, NULL, '[]'::jsonb),
    (v_job_warehouse, CURRENT_DATE - 41, 6, 10.0, 23, false, NULL, NULL, jsonb_build_array(v_photo_4, v_photo_5)),
    (v_job_warehouse, CURRENT_DATE - 43, 6, 10.0, 20, false, NULL, NULL, '[]'::jsonb),
    (v_job_warehouse, CURRENT_DATE - 45, 5, 9.0, 17, false, NULL, NULL, jsonb_build_array(v_photo_1)),
    (v_job_warehouse, CURRENT_DATE - 48, 4, 6.0,  8, false, NULL, 'Mobilization day — equipment staging and site walk.', '[]'::jsonb);

  -- 6. Portal documents (2 global + 2 per-job)
  INSERT INTO public.portal_documents (portal_id, job_id, title, description, file_url, file_type, document_source) VALUES
    (v_portal_id, NULL, 'S&W Foundation — 2026 Bid Proposal Package', 'Master proposal covering all three Acme projects. Includes scope, pricing, schedule, and exclusions.', 'https://example.com/demo/acme-2026-bid-proposal.pdf', 'bid_proposal', 'bid_draft'),
    (v_portal_id, NULL, 'S&W Site Safety Plan', 'Project-specific safety plan covering drilled pier operations across all Acme jobsites.', 'https://example.com/demo/sw-site-safety-plan.pdf', 'pdf', 'upload'),
    (v_portal_id, v_job_hospital, 'Mercy Regional — Pier Log Summary (Week 3)', 'Drilled depths, bearing capacities, and inspection sign-offs for piers P-085 through P-128.', 'https://example.com/demo/mercy-pier-log-week3.pdf', 'pdf', 'report'),
    (v_portal_id, v_job_warehouse, 'Lakeside — Final Pier Inspection Report', 'Stamped final inspection report covering all 320 piers, including third-party CMT data.', 'https://example.com/demo/lakeside-final-inspection.pdf', 'pdf', 'report');

  RAISE NOTICE 'Demo portal seeded. URL: /project/demo  Portal ID: %', v_portal_id;
END $$;

COMMIT;
