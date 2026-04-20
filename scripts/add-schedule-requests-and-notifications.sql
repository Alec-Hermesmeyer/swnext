-- Run in Supabase SQL Editor: adds the Schedule Requests workflow (sales
-- pitches a start date → ops accepts/rejects) plus a general-purpose
-- admin_notifications table that drives the bell in the sidebar header.
-- Both tables are meant to be published to supabase_realtime so the UI
-- reacts live when either side of the conversation moves.

-- ── schedule_requests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  gc_name TEXT,
  job_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  zip TEXT,
  requested_start_date DATE,
  estimated_days INTEGER,
  pier_count INTEGER,
  crane_required BOOLEAN NOT NULL DEFAULT false,
  rig_type TEXT,
  scope_notes TEXT,
  requested_by TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'scheduled', 'cancelled')),
  decision_by TEXT,
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,
  scheduled_start_date DATE,
  linked_job_id UUID REFERENCES public.crew_jobs (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS schedule_requests_status_idx
  ON public.schedule_requests (status);
CREATE INDEX IF NOT EXISTS schedule_requests_requested_at_idx
  ON public.schedule_requests (requested_at DESC);
CREATE INDEX IF NOT EXISTS schedule_requests_requested_start_idx
  ON public.schedule_requests (requested_start_date);

CREATE OR REPLACE FUNCTION public.touch_schedule_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS schedule_requests_set_updated_at ON public.schedule_requests;
CREATE TRIGGER schedule_requests_set_updated_at
  BEFORE UPDATE ON public.schedule_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_schedule_requests_updated_at();

COMMENT ON TABLE public.schedule_requests IS 'Sales → Ops scheduling requests. Sales asks "can we start this job on date X?"; ops approves/rejects/reschedules. Future: AI auto-suggests approval based on crew availability.';
COMMENT ON COLUMN public.schedule_requests.scheduled_start_date IS 'Start date ops commits to (may differ from requested_start_date).';
COMMENT ON COLUMN public.schedule_requests.linked_job_id IS 'Once approved, the crew_job created for this request.';

-- ── admin_notifications ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Targeting: either a specific user email OR a role. At least one should be set.
  target_email TEXT,
  target_role TEXT,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  kind TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_by JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_notifications_target_email_idx
  ON public.admin_notifications (target_email);
CREATE INDEX IF NOT EXISTS admin_notifications_target_role_idx
  ON public.admin_notifications (target_role);
CREATE INDEX IF NOT EXISTS admin_notifications_created_at_idx
  ON public.admin_notifications (created_at DESC);

COMMENT ON TABLE public.admin_notifications IS 'In-app notifications. Target by email, role, or both. read_by is a JSON array of emails that have dismissed it — supports role-targeted notifications where each user marks individually.';
COMMENT ON COLUMN public.admin_notifications.kind IS 'Event type: schedule_request_created, schedule_request_decided, cert_expiring, field_report_filed, etc.';
COMMENT ON COLUMN public.admin_notifications.link IS 'Relative URL to jump to when clicked — e.g., /admin/schedule-requests';
COMMENT ON COLUMN public.admin_notifications.metadata IS 'Free-form JSON for event-specific details (e.g., { request_id: "...", customer: "..." })';
