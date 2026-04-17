"use client";

import { useCallback, useEffect, useRef } from "react";
import supabase from "@/components/Supabase";

/**
 * Keeps a page's data fresh without manual refresh.
 *
 * @param {() => Promise<void>} loader - Your existing fetch/reload function.
 *   Should be stable (wrap in useCallback).
 * @param {Object} [options]
 * @param {boolean} [options.refetchOnFocus=true]  - Refetch when window gains focus or tab becomes visible.
 * @param {number}  [options.pollIntervalMs]       - Background poll interval in ms (e.g., 60000). Omit to disable.
 * @param {number}  [options.focusDebounceMs=2000] - Minimum ms between focus-driven refetches (avoids storms).
 * @param {Array<string|{table:string, filter?:string}>} [options.realtimeTables]
 *   Supabase Realtime: any INSERT/UPDATE/DELETE on these tables triggers a refetch.
 *   Requires the table to be in the `supabase_realtime` publication (see scripts/enable-supabase-realtime.sql).
 *
 * Notes:
 * - Does NOT trigger an initial load. Your existing useEffect(() => loader(), [deps]) still owns that.
 *   This hook only handles the "keep it fresh" layer on top.
 * - Realtime uses a single channel per mount; cleans up on unmount or when `realtimeTables` changes.
 */
export function useLiveData(loader, options = {}) {
  const {
    refetchOnFocus = true,
    pollIntervalMs,
    focusDebounceMs = 2000,
    realtimeTables,
  } = options;

  const loaderRef = useRef(loader);
  const lastRunRef = useRef(0);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const runLoader = useCallback(() => {
    const now = Date.now();
    if (now - lastRunRef.current < focusDebounceMs) return;
    lastRunRef.current = now;
    try {
      const result = loaderRef.current?.();
      if (result && typeof result.catch === "function") {
        result.catch(() => {}); // Swallow — caller handles its own errors
      }
    } catch {
      // Defensive: never let refresh logic crash the app
    }
  }, [focusDebounceMs]);

  // ── Focus + visibility refresh ───────────────────────────────────────
  useEffect(() => {
    if (!refetchOnFocus || typeof window === "undefined") return undefined;

    const onFocus = () => runLoader();
    const onVisibility = () => {
      if (document.visibilityState === "visible") runLoader();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refetchOnFocus, runLoader]);

  // ── Polling ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pollIntervalMs || pollIntervalMs <= 0) return undefined;
    const id = setInterval(() => {
      // Only poll when the tab is actually visible — don't hammer the DB in background
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      runLoader();
    }, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs, runLoader]);

  // ── Supabase Realtime ────────────────────────────────────────────────
  const realtimeKey = JSON.stringify(realtimeTables || null);
  useEffect(() => {
    if (!realtimeTables || realtimeTables.length === 0) return undefined;

    const channelName = `live-${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase.channel(channelName);

    realtimeTables.forEach((entry) => {
      const table = typeof entry === "string" ? entry : entry?.table;
      const filter = typeof entry === "object" ? entry?.filter : undefined;
      if (!table) return;
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => runLoader()
      );
    });

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeKey, runLoader]);
}

export default useLiveData;
