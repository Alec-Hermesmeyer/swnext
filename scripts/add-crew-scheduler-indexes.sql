-- Database indexes for crew scheduler optimization
-- Run this migration to improve query performance

-- Indexes for sw_crew_jobs table
CREATE INDEX IF NOT EXISTS idx_crew_jobs_active ON sw_crew_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_crew_jobs_name ON sw_crew_jobs(job_name);
CREATE INDEX IF NOT EXISTS idx_crew_jobs_number ON sw_crew_jobs(job_number);
CREATE INDEX IF NOT EXISTS idx_crew_jobs_customer ON sw_crew_jobs(customer_name);
CREATE INDEX IF NOT EXISTS idx_crew_jobs_city ON sw_crew_jobs(city);
CREATE INDEX IF NOT EXISTS idx_crew_jobs_composite ON sw_crew_jobs(is_active, job_name, job_number);

-- Indexes for sw_crew_workers table
CREATE INDEX IF NOT EXISTS idx_crew_workers_active ON sw_crew_workers(is_active);
CREATE INDEX IF NOT EXISTS idx_crew_workers_name ON sw_crew_workers(name);
CREATE INDEX IF NOT EXISTS idx_crew_workers_role ON sw_crew_workers(role);
CREATE INDEX IF NOT EXISTS idx_crew_workers_supervisor ON sw_crew_workers(is_supervisor);
CREATE INDEX IF NOT EXISTS idx_crew_workers_composite ON sw_crew_workers(is_active, name, role);

-- Indexes for sw_crew_schedules table
CREATE INDEX IF NOT EXISTS idx_crew_schedules_date ON sw_crew_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_crew_schedules_job ON sw_crew_schedules(job_id);
CREATE INDEX IF NOT EXISTS idx_crew_schedules_worker ON sw_crew_schedules(worker_id);
CREATE INDEX IF NOT EXISTS idx_crew_schedules_time ON sw_crew_schedules(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_crew_schedules_date_range ON sw_crew_schedules(schedule_date, job_id, worker_id);
CREATE INDEX IF NOT EXISTS idx_crew_schedules_composite ON sw_crew_schedules(schedule_date, job_id, worker_id, start_time);

-- Indexes for sw_crew_job_progress table
CREATE INDEX IF NOT EXISTS idx_crew_progress_job ON sw_crew_job_progress(job_id);
CREATE INDEX IF NOT EXISTS idx_crew_progress_status ON sw_crew_job_progress(status);
CREATE INDEX IF NOT EXISTS idx_crew_progress_dates ON sw_crew_job_progress(estimated_start_date, estimated_end_date);
CREATE INDEX IF NOT EXISTS idx_crew_progress_composite ON sw_crew_job_progress(job_id, status, updated_at);

-- Performance optimization for frequently used queries
-- These partial indexes optimize specific query patterns

-- Partial index for active jobs with progress
CREATE INDEX IF NOT EXISTS idx_active_jobs_with_progress ON sw_crew_jobs(id, job_name)
WHERE is_active = true;

-- Partial index for today's schedules
CREATE INDEX IF NOT EXISTS idx_today_schedules ON sw_crew_schedules(schedule_date, job_id, worker_id)
WHERE schedule_date >= CURRENT_DATE;

-- Partial index for active workers by role
CREATE INDEX IF NOT EXISTS idx_active_workers_by_role ON sw_crew_workers(role, name)
WHERE is_active != false;

-- Analyze tables to update statistics for query planner
ANALYZE sw_crew_jobs;
ANALYZE sw_crew_workers;
ANALYZE sw_crew_schedules;
ANALYZE sw_crew_job_progress;