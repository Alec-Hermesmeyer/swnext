"use client";

import { useEffect } from "react";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

/**
 * Iframe-backed modal that hosts the full Crew Scheduler without forcing
 * the user to navigate away from /admin/jobs. Uses ?embedded=true which
 * TWAdminLayout already honors to strip the sidebar/topbar.
 *
 * Props:
 *  - isOpen
 *  - onClose
 *  - focusJobId (optional) — passed as a query hint so the scheduler could
 *    preselect a job if/when that's wired up on the scheduler side
 *  - title (optional, default: "Crew Scheduler")
 */
export default function SchedulerModal({ isOpen, onClose, focusJobId, title = "Crew Scheduler" }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    // Prevent body scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const params = new URLSearchParams({ embedded: "true" });
  if (focusJobId) params.set("focus_job_id", focusJobId);
  const src = `/admin/crew-scheduler?${params.toString()}`;
  const fullscreenHref = `/admin/crew-scheduler${focusJobId ? `?focus_job_id=${focusJobId}` : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
      <div className={`${lato.className} flex h-[96vh] w-full max-w-[1600px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}>
        <header className="flex items-center justify-between border-b border-neutral-200 bg-gradient-to-r from-brand to-brand-light px-5 py-3 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold leading-tight">{title}</h2>
              <p className="text-[11px] text-white/80">
                Search, assign crew, finalize — without leaving Jobs. Changes sync live.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={fullscreenHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white/90 transition-colors hover:bg-white/15"
              title="Open in new tab"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Open full
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden bg-neutral-100">
          <iframe
            key={src /* remount if focus changes */}
            src={src}
            title={title}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
