"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useNotifications from "@/hooks/useNotifications";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications";

const MAX_IN_DROPDOWN = 15;

function formatTimeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const KIND_ICONS = {
  schedule_request_created: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  ),
  schedule_request_decided: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  default: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  ),
};

export default function NotificationsBell() {
  const { all, unreadCount, userEmail, reload } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleClickNotification = async (n) => {
    if (userEmail) {
      await markNotificationRead(n.id, userEmail);
    }
    setOpen(false);
    if (n.link) {
      router.push(n.link);
    }
    reload();
  };

  const handleMarkAllRead = async () => {
    if (!userEmail) return;
    await markAllNotificationsRead(all, userEmail);
    reload();
  };

  const visible = all.slice(0, MAX_IN_DROPDOWN);
  const hasMore = all.length > MAX_IN_DROPDOWN;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card-hover">
          <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <p className="text-sm font-bold text-neutral-900">
              Notifications
              {unreadCount > 0 ? (
                <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                  {unreadCount} new
                </span>
              ) : null}
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-brand hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </header>

          <div className="max-h-[420px] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-neutral-500">You're all caught up.</p>
                <p className="mt-1 text-xs text-neutral-400">New events will show up here.</p>
              </div>
            ) : (
              visible.map((n) => {
                const unread = !Array.isArray(n.read_by) || !n.read_by.includes(userEmail);
                const icon = KIND_ICONS[n.kind] || KIND_ICONS.default;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClickNotification(n)}
                    className={`flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                      unread ? "bg-brand/5" : ""
                    }`}
                  >
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      unread ? "bg-brand text-white" : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${unread ? "font-bold text-neutral-900" : "font-semibold text-neutral-700"}`}>
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[10px] font-semibold text-neutral-400">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>
                      {n.body ? (
                        <p className="mt-0.5 text-xs text-neutral-600 line-clamp-2">{n.body}</p>
                      ) : null}
                      {unread ? (
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-brand" />
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {hasMore ? (
            <footer className="border-t border-neutral-100 px-4 py-2 text-center">
              <p className="text-[11px] text-neutral-500">
                Showing {MAX_IN_DROPDOWN} of {all.length}
              </p>
            </footer>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
