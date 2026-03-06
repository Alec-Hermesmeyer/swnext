-- Schedule Automation: Database Migrations
-- Run this in your Supabase SQL editor
-- These tables extend the existing crew scheduler schema

-- ============================================
-- NEW TABLE: Superintendents
-- ============================================
CREATE TABLE IF NOT EXISTS crew_superintendents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NEW TABLE: Trucks
-- ============================================
CREATE TABLE IF NOT EXISTS crew_trucks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_number TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NEW TABLE: Per-rig details for each schedule
-- ============================================
CREATE TABLE IF NOT EXISTS schedule_rig_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES crew_schedules(id) ON DELETE CASCADE,
  category_id UUID REFERENCES crew_categories(id) ON DELETE CASCADE,
  superintendent_id UUID REFERENCES crew_superintendents(id) ON DELETE SET NULL,
  truck_id UUID REFERENCES crew_trucks(id) ON DELETE SET NULL,
  crane_info TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, category_id)
);

-- ============================================
-- ALTER: Add dig_tess_number to crew_jobs
-- ============================================
ALTER TABLE crew_jobs ADD COLUMN IF NOT EXISTS dig_tess_number TEXT;

-- ============================================
-- ALTER: Hiring contractor contact fields
-- ============================================
ALTER TABLE crew_jobs ADD COLUMN IF NOT EXISTS hiring_contractor TEXT;
ALTER TABLE crew_jobs ADD COLUMN IF NOT EXISTS hiring_contact_name TEXT;
ALTER TABLE crew_jobs ADD COLUMN IF NOT EXISTS hiring_contact_phone TEXT;
ALTER TABLE crew_jobs ADD COLUMN IF NOT EXISTS hiring_contact_email TEXT;

-- ============================================
-- ALTER: Add finalization fields to crew_schedules
-- ============================================
ALTER TABLE crew_schedules ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT false;
ALTER TABLE crew_schedules ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;
ALTER TABLE crew_schedules ADD COLUMN IF NOT EXISTS finalized_by TEXT;

-- ============================================
-- Enable RLS on new tables
-- ============================================
ALTER TABLE crew_superintendents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_rig_details ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies (match existing pattern: allow all for authenticated)
-- ============================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON crew_superintendents;
CREATE POLICY "Allow all for authenticated users" ON crew_superintendents FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all for authenticated users" ON crew_trucks;
CREATE POLICY "Allow all for authenticated users" ON crew_trucks FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all for authenticated users" ON schedule_rig_details;
CREATE POLICY "Allow all for authenticated users" ON schedule_rig_details FOR ALL USING (true);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rig_details_schedule ON schedule_rig_details(schedule_id);
CREATE INDEX IF NOT EXISTS idx_rig_details_category ON schedule_rig_details(category_id);
CREATE INDEX IF NOT EXISTS idx_superintendents_active ON crew_superintendents(is_active);
CREATE INDEX IF NOT EXISTS idx_trucks_active ON crew_trucks(is_active);

-- ============================================
-- NEW TABLE: Job progress (current snapshot per job)
-- ============================================
CREATE TABLE IF NOT EXISTS crew_job_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL UNIQUE REFERENCES crew_jobs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'planned',
  holes_completed INTEGER,
  holes_target INTEGER,
  estimated_start_date DATE,
  estimated_end_date DATE,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NEW TABLE: Job progress update history
-- ============================================
CREATE TABLE IF NOT EXISTS crew_job_progress_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES crew_jobs(id) ON DELETE CASCADE,
  update_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'planned',
  holes_completed INTEGER,
  holes_target INTEGER,
  estimated_start_date DATE,
  estimated_end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crew_job_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_job_progress_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON crew_job_progress;
CREATE POLICY "Allow all for authenticated users" ON crew_job_progress FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all for authenticated users" ON crew_job_progress_updates;
CREATE POLICY "Allow all for authenticated users" ON crew_job_progress_updates FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_job_progress_job ON crew_job_progress(job_id);
CREATE INDEX IF NOT EXISTS idx_job_progress_updates_job ON crew_job_progress_updates(job_id);
CREATE INDEX IF NOT EXISTS idx_job_progress_updates_date ON crew_job_progress_updates(update_date);
