-- Crew Scheduler Database Schema
-- Run this in your Supabase SQL editor

-- Workers table (employees that can be assigned)
CREATE TABLE IF NOT EXISTS crew_workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT, -- optional default role
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table (active field jobs for scheduling)
CREATE TABLE IF NOT EXISTS crew_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  job_number TEXT,
  customer_name TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  pm_name TEXT, -- S&W Project Manager
  pm_phone TEXT,
  pm_email TEXT,
  default_rig TEXT, -- default rig assignment for this job
  crane_required BOOLEAN DEFAULT false,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table (Rig, Crane, Equipment, Jobs, etc.)
CREATE TABLE IF NOT EXISTS crew_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280', -- hex color for UI
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules table (one per day)
CREATE TABLE IF NOT EXISTS crew_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_date DATE NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table (links workers to schedules and categories)
CREATE TABLE IF NOT EXISTS crew_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES crew_schedules(id) ON DELETE CASCADE,
  category_id UUID REFERENCES crew_categories(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES crew_workers(id) ON DELETE CASCADE,
  job_id UUID REFERENCES crew_jobs(id) ON DELETE SET NULL, -- link to job
  job_name TEXT, -- fallback text if no job linked (legacy)
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE crew_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_jobs ENABLE ROW LEVEL SECURITY;

-- Policies (allow authenticated users full access)
CREATE POLICY "Allow all for authenticated users" ON crew_workers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON crew_categories FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON crew_schedules FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON crew_assignments FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON crew_jobs FOR ALL USING (true);

-- Insert default categories (customize these)
INSERT INTO crew_categories (name, color, sort_order) VALUES
  ('Rig 1', '#dc2626', 1),
  ('Rig 2', '#ea580c', 2),
  ('Crane', '#2563eb', 3),
  ('Equipment', '#16a34a', 4),
  ('Shop', '#7c3aed', 5)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_schedule ON crew_assignments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_assignments_category ON crew_assignments(category_id);
CREATE INDEX IF NOT EXISTS idx_assignments_job ON crew_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON crew_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON crew_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_number ON crew_jobs(job_number);

-- Migration: Add job_id column to existing crew_assignments table
-- Run this if you already have the table created:
-- ALTER TABLE crew_assignments ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES crew_jobs(id) ON DELETE SET NULL;

-- ============================================
-- Schedule Automation Extension Tables
-- See also: /docs/schedule-automation-schema.sql
-- ============================================

-- Superintendents table
CREATE TABLE IF NOT EXISTS crew_superintendents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trucks table
CREATE TABLE IF NOT EXISTS crew_trucks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_number TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-rig details (superintendent, truck, crane per rig per day)
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

-- Finalization fields on crew_schedules
ALTER TABLE crew_schedules ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT false;
ALTER TABLE crew_schedules ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;
ALTER TABLE crew_schedules ADD COLUMN IF NOT EXISTS finalized_by TEXT;

-- Dig Tess number on crew_jobs
ALTER TABLE crew_jobs ADD COLUMN IF NOT EXISTS dig_tess_number TEXT;

-- RLS + policies for new tables
ALTER TABLE crew_superintendents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_rig_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON crew_superintendents FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON crew_trucks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON schedule_rig_details FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_rig_details_schedule ON schedule_rig_details(schedule_id);
CREATE INDEX IF NOT EXISTS idx_rig_details_category ON schedule_rig_details(category_id);
CREATE INDEX IF NOT EXISTS idx_superintendents_active ON crew_superintendents(is_active);
CREATE INDEX IF NOT EXISTS idx_trucks_active ON crew_trucks(is_active);
