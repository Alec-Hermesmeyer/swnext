"use client";

import { useEffect, useMemo, useState } from "react";
import { Lato } from "next/font/google";
import supabase from "@/components/Supabase";
import { JobSearchSelect } from "@/components/admin/client-portal";
import { normalizeDraftPayload } from "./bid-assistant-utils";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

export default function PublishToPortalModal({ selectedDoc, draft, onClose, onStatus }) {
  const [portals, setPortals] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [portalFilter, setPortalFilter] = useState("");
  const [selectedPortalId, setSelectedPortalId] = useState("");
  const [jobId, setJobId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setTitle(draft?.title?.trim() || selectedDoc?.filename?.replace(/\.[^/.]+$/, "") || "Bid Proposal");
  }, [draft?.title, selectedDoc?.filename]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [portalsRes, jobsRes] = await Promise.all([
          supabase
            .from("client_portals")
            .select("id, label, match_name, contact_name")
            .eq("is_active", true)
            .order("label", { ascending: true }),
          supabase
            .from("crew_jobs")
            .select("id, job_name, job_number, customer_name, hiring_contractor, city")
            .order("job_name", { ascending: true }),
        ]);
        if (cancelled) return;
        if (portalsRes.error) throw portalsRes.error;
        if (jobsRes.error) throw jobsRes.error;
        setPortals(portalsRes.data || []);
        setAllJobs(jobsRes.data || []);
      } catch (err) {
        if (!cancelled) setErrorMessage(err?.message || "Could not load portals.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visiblePortals = useMemo(() => {
    const q = portalFilter.trim().toLowerCase();
    if (!q) return portals;
    return portals.filter((p) =>
      [p.label, p.match_name, p.contact_name]
        .filter(Boolean)
        .some((s) => s.toLowerCase().includes(q))
    );
  }, [portals, portalFilter]);

  const selectedPortal = portals.find((p) => p.id === selectedPortalId);

  const jobsForPortal = useMemo(() => {
    if (!selectedPortal) return [];
    const mn = (selectedPortal.match_name || "").trim().toLowerCase();
    if (!mn) return [];
    return allJobs.filter((j) => {
      const cust = (j.customer_name || "").trim().toLowerCase();
      const gc = (j.hiring_contractor || "").trim().toLowerCase();
      return cust === mn || gc === mn;
    });
  }, [allJobs, selectedPortal]);

  useEffect(() => { setJobId(""); }, [selectedPortalId]);

  const canPublish = Boolean(selectedPortalId && title.trim() && !publishing && selectedDoc?.id);

  const publish = async () => {
    if (!canPublish) return;
    setPublishing(true);
    setErrorMessage("");
    try {
      // 1. Persist the latest draft so the server export reflects unsaved edits.
      const saveRes = await fetch(
        `/api/bidding/ai-bidding/documents/${selectedDoc.id}/draft`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizeDraftPayload(draft)),
        }
      );
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(err?.detail || err?.error || "Could not save draft before publishing");
      }

      // 2. Ask the server to export, upload, and record the portal document.
      const publishRes = await fetch("/api/portal-documents/publish-bid-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portal_id: selectedPortalId,
          bid_document_id: selectedDoc.id,
          job_id: jobId || null,
          title: title.trim(),
          description: description.trim() || null,
        }),
      });
      const publishData = await publishRes.json().catch(() => ({}));
      if (!publishRes.ok) {
        const setupHint = publishData?.setup ? ` ${publishData.setup}` : "";
        throw new Error((publishData?.error || "Could not publish") + setupHint);
      }

      onStatus?.(`Published to ${selectedPortal?.label || "portal"}.`);
      onClose?.();
    } catch (err) {
      setErrorMessage(err?.message || "Could not publish");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
              Publish to Client Portal
            </h2>
            <p className="text-xs text-neutral-500">
              Export a DOCX snapshot of this draft and share it on a portal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div>
            <label className="text-sm font-semibold text-neutral-700">Client Portal</label>
            {loading ? (
              <p className="mt-1 text-xs text-neutral-400">Loading portals...</p>
            ) : portals.length === 0 ? (
              <p className="mt-1 text-xs text-rose-600">
                No active portals found. Create one first in Admin → Client Portals.
              </p>
            ) : (
              <>
                <input
                  type="text"
                  value={portalFilter}
                  onChange={(e) => setPortalFilter(e.target.value)}
                  placeholder="Filter by label, customer, or contact..."
                  className="mt-1 h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                />
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-neutral-200">
                  {visiblePortals.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-neutral-400">
                      No portals match.
                    </p>
                  ) : (
                    visiblePortals.map((p) => {
                      const active = selectedPortalId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPortalId(p.id)}
                          className={`flex w-full items-center justify-between border-b border-neutral-100 px-3 py-2 text-left text-sm transition-colors last:border-b-0 ${
                            active ? "bg-brand-50" : "hover:bg-neutral-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-neutral-900">{p.label}</p>
                            <p className="truncate text-[11px] text-neutral-500">
                              {p.match_name}
                              {p.contact_name ? ` · ${p.contact_name}` : ""}
                            </p>
                          </div>
                          {active ? (
                            <svg className="h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {selectedPortalId ? (
            <div>
              <label className="text-sm font-semibold text-neutral-700">
                Associate with a job
                <span className="ml-1 text-[11px] font-normal text-neutral-400">(optional)</span>
              </label>
              <div className="mt-1">
                <JobSearchSelect
                  jobs={jobsForPortal}
                  value={jobId}
                  onChange={setJobId}
                  placeholder="Leave blank to show on all jobs"
                  allowNone
                  noneLabel="All jobs (global document)"
                />
              </div>
              {jobsForPortal.length === 0 ? (
                <p className="mt-1 text-[11px] text-neutral-400">
                  No auto-matched jobs for this portal yet.
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="text-sm font-semibold text-neutral-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bid Proposal — Phase 1"
              className="mt-1 h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700">
              Description
              <span className="ml-1 text-[11px] font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this document?"
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50 px-5 py-3">
          <p className="text-[11px] text-neutral-500">
            A DOCX snapshot is frozen at publish time. Re-publish to update.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canPublish}
              onClick={publish}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60"
            >
              {publishing ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Publishing...
                </>
              ) : (
                "Publish"
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
