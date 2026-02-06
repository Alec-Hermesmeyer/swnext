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
CREATE POLICY "Allow all for authenticated users" ON crew_superintendents FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON crew_trucks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON schedule_rig_details FOR ALL USING (true);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rig_details_schedule ON schedule_rig_details(schedule_id);
CREATE INDEX IF NOT EXISTS idx_rig_details_category ON schedule_rig_details(category_id);
CREATE INDEX IF NOT EXISTS idx_superintendents_active ON crew_superintendents(is_active);
CREATE INDEX IF NOT EXISTS idx_trucks_active ON crew_trucks(is_active);
