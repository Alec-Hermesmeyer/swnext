import supabase from "@/components/Supabase";

// Cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function invalidateCache(pattern) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

// Batch fetch functions
export async function fetchJobs(forceRefresh = false) {
  const cacheKey = "jobs";

  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const { data, error } = await supabase
      .from("sw_crew_jobs")
      .select("*")
      .order("job_name", { ascending: true });

    if (error) throw error;

    setCachedData(cacheKey, data || []);
    return data || [];
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
}

export async function fetchWorkers(forceRefresh = false) {
  const cacheKey = "workers";

  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const { data, error } = await supabase
      .from("sw_crew_workers")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    setCachedData(cacheKey, data || []);
    return data || [];
  } catch (error) {
    console.error("Error fetching workers:", error);
    return [];
  }
}

export async function fetchSchedules(startDate, endDate, forceRefresh = false) {
  const cacheKey = `schedules_${startDate}_${endDate}`;

  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const { data, error } = await supabase
      .from("sw_crew_schedules")
      .select("*")
      .gte("schedule_date", startDate)
      .lte("schedule_date", endDate)
      .order("schedule_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    setCachedData(cacheKey, data || []);
    return data || [];
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return [];
  }
}

export async function fetchJobProgress(jobIds, forceRefresh = false) {
  if (!jobIds || jobIds.length === 0) return {};

  const cacheKey = `progress_${jobIds.join("_")}`;

  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const { data, error } = await supabase
      .from("sw_crew_job_progress")
      .select("*")
      .in("job_id", jobIds);

    if (error) throw error;

    const progressMap = {};
    (data || []).forEach(progress => {
      progressMap[progress.job_id] = progress;
    });

    setCachedData(cacheKey, progressMap);
    return progressMap;
  } catch (error) {
    console.error("Error fetching job progress:", error);
    return {};
  }
}

// Batch operations
export async function batchCreateSchedules(schedules) {
  try {
    const { data, error } = await supabase
      .from("sw_crew_schedules")
      .insert(schedules)
      .select();

    if (error) throw error;

    invalidateCache("schedules");
    return { success: true, data };
  } catch (error) {
    console.error("Error creating schedules:", error);
    return { success: false, error };
  }
}

export async function batchUpdateSchedules(updates) {
  try {
    const promises = updates.map(({ id, ...update }) =>
      supabase
        .from("sw_crew_schedules")
        .update(update)
        .eq("id", id)
        .select()
    );

    const results = await Promise.all(promises);
    const hasError = results.some(r => r.error);

    if (hasError) {
      throw new Error("Some updates failed");
    }

    invalidateCache("schedules");
    return { success: true, data: results.map(r => r.data).flat() };
  } catch (error) {
    console.error("Error updating schedules:", error);
    return { success: false, error };
  }
}

export async function batchDeleteSchedules(ids) {
  try {
    const { error } = await supabase
      .from("sw_crew_schedules")
      .delete()
      .in("id", ids);

    if (error) throw error;

    invalidateCache("schedules");
    return { success: true };
  } catch (error) {
    console.error("Error deleting schedules:", error);
    return { success: false, error };
  }
}

// Single operations with cache invalidation
export async function createJob(job) {
  try {
    const { data, error } = await supabase
      .from("sw_crew_jobs")
      .insert(job)
      .select()
      .single();

    if (error) throw error;

    invalidateCache("jobs");
    return { success: true, data };
  } catch (error) {
    console.error("Error creating job:", error);
    return { success: false, error };
  }
}

export async function updateJob(id, updates) {
  try {
    const { data, error } = await supabase
      .from("sw_crew_jobs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    invalidateCache("jobs");
    return { success: true, data };
  } catch (error) {
    console.error("Error updating job:", error);
    return { success: false, error };
  }
}

export async function createWorker(worker) {
  try {
    const { data, error } = await supabase
      .from("sw_crew_workers")
      .insert(worker)
      .select()
      .single();

    if (error) throw error;

    invalidateCache("workers");
    return { success: true, data };
  } catch (error) {
    console.error("Error creating worker:", error);
    return { success: false, error };
  }
}

export async function updateWorker(id, updates) {
  try {
    const { data, error } = await supabase
      .from("sw_crew_workers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    invalidateCache("workers");
    return { success: true, data };
  } catch (error) {
    console.error("Error updating worker:", error);
    return { success: false, error };
  }
}

export async function updateJobProgress(jobId, progress) {
  try {
    const { data, error } = await supabase
      .from("sw_crew_job_progress")
      .upsert({
        job_id: jobId,
        ...progress,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    invalidateCache("progress");
    return { success: true, data };
  } catch (error) {
    console.error("Error updating job progress:", error);
    return { success: false, error };
  }
}

// Prefetch data for better performance
export async function prefetchData(dateRange) {
  const promises = [
    fetchJobs(),
    fetchWorkers(),
    fetchSchedules(dateRange.start, dateRange.end)
  ];

  try {
    const [jobs, workers, schedules] = await Promise.all(promises);

    // Prefetch progress for active jobs
    const activeJobIds = jobs
      .filter(j => j.is_active !== false)
      .map(j => j.id);

    await fetchJobProgress(activeJobIds);

    return { jobs, workers, schedules };
  } catch (error) {
    console.error("Error prefetching data:", error);
    return null;
  }
}

export default {
  fetchJobs,
  fetchWorkers,
  fetchSchedules,
  fetchJobProgress,
  batchCreateSchedules,
  batchUpdateSchedules,
  batchDeleteSchedules,
  createJob,
  updateJob,
  createWorker,
  updateWorker,
  updateJobProgress,
  prefetchData,
  invalidateCache
};