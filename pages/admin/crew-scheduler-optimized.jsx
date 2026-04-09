"use client";
import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { Lato } from "next/font/google";
import { Calendar, Users, Briefcase, Settings, Loader2 } from "lucide-react";

// Lazy load heavy components
const VirtualJobList = dynamic(() => import("@/components/admin/crew-scheduler/VirtualJobList"), {
  loading: () => <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

const ScheduleGrid = dynamic(() => import("@/components/admin/crew-scheduler/ScheduleGrid"), {
  loading: () => <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

const WorkerPanel = dynamic(() => import("@/components/admin/crew-scheduler/WorkerPanel"), {
  loading: () => <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

const OptimizedChatBubble = dynamic(() => import("@/components/admin/OptimizedChatBubble"), {
  ssr: false
});

// Import state management and API utilities
import useCrewSchedulerState from "@/hooks/useCrewSchedulerState";
import api from "@/utils/crewSchedulerAPI";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

// Date utilities
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateInputValue = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDateString = (value, days) => {
  const base = new Date(value);
  base.setDate(base.getDate() + days);
  return formatDateInputValue(base);
};

// Tab Navigation Component
const TabNavigation = ({ activeTab, onTabChange, counts }) => {
  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar, count: counts.schedules },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, count: counts.jobs },
    { id: 'workers', label: 'Workers', icon: Users, count: counts.workers },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex space-x-1 bg-neutral-100 p-1 rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-neutral-200 text-neutral-600'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// Date Picker Component
const DatePicker = ({ selectedDate, onChange }) => {
  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-neutral-200">
      <button
        onClick={() => onChange(shiftDateString(selectedDate, -1))}
        className="p-1 hover:bg-neutral-100 rounded transition-colors"
        aria-label="Previous day"
      >
        <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1 text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      />

      <button
        onClick={() => onChange(shiftDateString(selectedDate, 1))}
        className="p-1 hover:bg-neutral-100 rounded transition-colors"
        aria-label="Next day"
      >
        <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button
        onClick={() => onChange(formatDateInputValue(new Date()))}
        className="ml-2 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
      >
        Today
      </button>
    </div>
  );
};

// Main Component
function CrewSchedulerOptimized() {
  const { state, actions } = useCrewSchedulerState();
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      actions.setLoading('initial', true);

      try {
        // Calculate date range for initial load (current month)
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Prefetch all data
        const data = await api.prefetchData({
          start: formatDateInputValue(startDate),
          end: formatDateInputValue(endDate)
        });

        if (data) {
          actions.setJobs(data.jobs || []);
          actions.setWorkers(data.workers || []);
          actions.setSchedules(data.schedules || []);

          // Load progress for active jobs
          const activeJobIds = data.jobs
            .filter(j => j.is_active !== false)
            .map(j => j.id);

          if (activeJobIds.length > 0) {
            const progress = await api.fetchJobProgress(activeJobIds);
            actions.setJobProgress(progress);
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error loading data:", error);
        actions.setError('initial', error.message);
      } finally {
        actions.setLoading('initial', false);
      }
    };

    loadData();
  }, []);

  // Handle date change - load schedules for new date range
  const handleDateChange = useCallback(async (newDate) => {
    actions.setSelectedDate(newDate);

    // Load schedules for a week around the selected date
    const startDate = shiftDateString(newDate, -3);
    const endDate = shiftDateString(newDate, 3);

    actions.setLoading('schedules', true);
    try {
      const schedules = await api.fetchSchedules(startDate, endDate);
      actions.setSchedules(schedules);
    } catch (error) {
      console.error("Error loading schedules:", error);
      actions.setError('schedules', error.message);
    } finally {
      actions.setLoading('schedules', false);
    }
  }, [actions]);

  // Job handlers
  const handleAddJob = useCallback(() => {
    actions.openModal('addJob');
  }, [actions]);

  const handleEditJob = useCallback((job) => {
    actions.setEditingEntity('editingJob', job);
    actions.openModal('editJob');
  }, [actions]);

  const handleToggleJobActive = useCallback(async (job) => {
    const newStatus = !job.is_active;
    const result = await api.updateJob(job.id, { is_active: newStatus });

    if (result.success) {
      actions.updateJob(result.data);
    }
  }, [actions]);

  const handleUpdateJobProgress = useCallback((job) => {
    actions.setEditingEntity('editingJob', job);
    actions.openModal('editProgress');
  }, [actions]);

  // Worker handlers
  const handleAddWorker = useCallback(() => {
    actions.openModal('addWorker');
  }, [actions]);

  const handleEditWorker = useCallback((worker) => {
    actions.setEditingEntity('editingWorker', worker);
    actions.openModal('editWorker');
  }, [actions]);

  const handleToggleWorkerActive = useCallback(async (worker) => {
    const newStatus = !worker.is_active;
    const result = await api.updateWorker(worker.id, { is_active: newStatus });

    if (result.success) {
      actions.updateWorker(result.data);
    }
  }, [actions]);

  // Schedule handlers
  const handleEditSchedule = useCallback((schedule) => {
    actions.setEditingEntity('editingSchedule', schedule);
    actions.openModal('editSchedule');
  }, [actions]);

  const handleDeleteSchedule = useCallback(async (scheduleId) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      const result = await api.batchDeleteSchedules([scheduleId]);

      if (result.success) {
        const updatedSchedules = state.schedules.filter(s => s.id !== scheduleId);
        actions.setSchedules(updatedSchedules);
      }
    }
  }, [state.schedules, actions]);

  // Calculate counts for tabs
  const counts = {
    schedules: state.schedules.filter(s => s.schedule_date === state.selectedDate).length,
    jobs: state.jobs.filter(j => j.is_active !== false).length,
    workers: state.workers.filter(w => w.is_active !== false).length
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-neutral-700">Loading Crew Scheduler...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Crew Scheduler - Optimized</title>
        <meta name="description" content="Optimized crew scheduling and management system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={`min-h-screen bg-neutral-50 ${lato.className}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Crew Scheduler</h1>
            <p className="text-neutral-600">Manage jobs, workers, and schedules efficiently</p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <TabNavigation
              activeTab={state.activePanel}
              onTabChange={actions.setActivePanel}
              counts={counts}
            />

            {state.activePanel === 'schedule' && (
              <DatePicker
                selectedDate={state.selectedDate}
                onChange={handleDateChange}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 min-h-[600px]">
            <Suspense fallback={
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            }>
              {state.activePanel === 'schedule' && (
                <div className="p-6">
                  <ScheduleGrid
                    schedules={state.schedules}
                    selectedDate={state.selectedDate}
                    jobs={state.jobs}
                    workers={state.workers}
                    onEditSchedule={handleEditSchedule}
                    onDeleteSchedule={handleDeleteSchedule}
                  />
                </div>
              )}

              {state.activePanel === 'jobs' && (
                <VirtualJobList
                  jobs={state.jobs}
                  onAddJob={handleAddJob}
                  onEditJob={handleEditJob}
                  onToggleActive={handleToggleJobActive}
                  onUpdateProgress={handleUpdateJobProgress}
                  jobProgress={state.jobProgress}
                  containerHeight={600}
                />
              )}

              {state.activePanel === 'workers' && (
                <WorkerPanel
                  workers={state.workers}
                  onAddWorker={handleAddWorker}
                  onEditWorker={handleEditWorker}
                  onToggleActive={handleToggleWorkerActive}
                />
              )}

              {state.activePanel === 'settings' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">Settings</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">Performance Optimizations</h3>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>✓ Virtual scrolling enabled for large lists</li>
                        <li>✓ Pagination active (50 items per page)</li>
                        <li>✓ Data caching enabled (5 minute TTL)</li>
                        <li>✓ Lazy loading for heavy components</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h3 className="font-medium text-amber-900 mb-2">Database Optimization</h3>
                      <p className="text-sm text-amber-700 mb-2">
                        Run the following script to add database indexes:
                      </p>
                      <code className="block p-2 bg-amber-100 rounded text-xs">
                        scripts/add-crew-scheduler-indexes.sql
                      </code>
                    </div>

                    <button
                      onClick={() => api.invalidateCache()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>
              )}
            </Suspense>
          </div>
        </div>

        {/* Chat Assistant */}
        <OptimizedChatBubble />
      </div>
    </>
  );
}

CrewSchedulerOptimized.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(CrewSchedulerOptimized);