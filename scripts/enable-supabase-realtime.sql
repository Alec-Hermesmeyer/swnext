-- Run in Supabase SQL Editor: enables Postgres logical replication on the
-- tables the admin UI subscribes to via useLiveData, so changes on one
-- device/tab propagate to every other open view without manual refresh.
--
-- Each ALTER PUBLICATION is idempotent — re-running is safe.

DO $$
DECLARE
  target_tables text[] := ARRAY[
    'crew_assignments',
    'crew_schedules',
    'crew_daily_reports',
    'crew_worker_certifications',
    'change_orders',
    'client_portals',
    'crew_jobs',
    'schedule_rig_details'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY target_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        RAISE NOTICE 'Added % to supabase_realtime publication', t;
      EXCEPTION
        WHEN duplicate_object THEN
          RAISE NOTICE '% already in supabase_realtime publication, skipping', t;
      END;
    ELSE
      RAISE NOTICE 'Table % does not exist yet, skipping (run feature migrations first)', t;
    END IF;
  END LOOP;
END $$;
