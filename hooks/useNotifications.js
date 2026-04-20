"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import supabase from "@/components/Supabase";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { filterVisibleNotifications, countUnread } from "@/lib/notifications";

/**
 * Fetches admin_notifications visible to the current user and keeps them
 * live-synced via useLiveData (realtime on admin_notifications).
 *
 * Returns { loading, all, unreadCount, reload }.
 */
export default function useNotifications({ limit = 50 } = {}) {
  const { user, role } = useAuth() || {};
  const userEmail = user?.email || null;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    if (!userEmail && !role) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Pull a window of notifications — filter client-side by email/role.
      // Table may not exist yet if migration hasn't run; silently no-op.
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        setRows([]);
        setErrorMessage(error.message || "");
      } else {
        setRows(data || []);
        setErrorMessage("");
      }
    } catch (err) {
      setErrorMessage(err?.message || "");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail, role, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useLiveData(load, { realtimeTables: ["admin_notifications"] });

  const visible = useMemo(
    () => filterVisibleNotifications(rows, userEmail, role),
    [rows, userEmail, role]
  );

  const unreadCount = useMemo(
    () => countUnread(visible, userEmail),
    [visible, userEmail]
  );

  return {
    loading,
    errorMessage,
    all: visible,
    unreadCount,
    reload: load,
    userEmail,
  };
}
