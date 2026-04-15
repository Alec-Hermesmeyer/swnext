"use client";
import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";
import { useAuth } from "@/context/AuthContext";
import { canAccessSalesPipeline, canAccessHiringPipeline } from "@/lib/roles";
import { buildOpportunityPayloadFromContactSubmission } from "@/lib/contact-to-pipeline";
import { buildHiringPayloadFromJobSubmission } from "@/lib/job-to-pipeline";
import { readCachedValue, writeCachedValue } from "@/lib/client-cache";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });
const SUBMISSIONS_CACHE_TTL_MS = 5 * 60 * 1000;

function SubmissionModal({
  submission,
  type,
  onClose,
  onDelete,
  onBlockEmail,
  pipelineEnabled,
  onPromoteToPipeline,
  promoteLoading,
  hiringEnabled,
  onPromoteToHiring,
  promoteHiringLoading,
}) {
  if (!submission) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
          <h3 className={`${lato.className} text-lg font-bold text-[#0b2a5a]`}>
            {type === "contact" ? "Contact Submission" : "Job Application"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center text-lg"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</label>
              <p className="mt-1 text-sm text-neutral-900">
                {submission.created_at ? new Date(submission.created_at).toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Name</label>
              <p className="mt-1 text-sm text-neutral-900 font-medium">
                {submission.name || submission.firstName || "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Email</label>
              <p className="mt-1 text-sm">
                {submission.email ? (
                  <Link href={`mailto:${submission.email}`} className="text-blue-600 hover:underline">
                    {submission.email}
                  </Link>
                ) : "—"}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Phone</label>
              <p className="mt-1 text-sm">
                {submission.number || submission.phone ? (
                  <Link href={`tel:${submission.number || submission.phone}`} className="text-blue-600 hover:underline">
                    {submission.number || submission.phone}
                  </Link>
                ) : "—"}
              </p>
            </div>
          </div>

          {type === "job" && (
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Position</label>
              <p className="mt-1">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {submission.position || "—"}
                </span>
              </p>
            </div>
          )}

          {type === "contact" && submission.message && (
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Message</label>
              <div className="mt-2 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-sm text-neutral-800 whitespace-pre-wrap">{submission.message}</p>
              </div>
            </div>
          )}

          {/* Show any additional fields */}
          {Object.entries(submission).map(([key, value]) => {
            if (['id', 'created_at', 'name', 'firstName', 'email', 'number', 'phone', 'message', 'position'].includes(key)) return null;
            if (!value) return null;
            return (
              <div key={key}>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  {key.replace(/_/g, ' ')}
                </label>
                <p className="mt-1 text-sm text-neutral-900">{String(value)}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-t border-neutral-200 bg-neutral-50">
          <div className="flex flex-wrap items-center gap-2">
            {type === "contact" && pipelineEnabled ? (
              <button
                type="button"
                onClick={() => onPromoteToPipeline?.(submission)}
                disabled={promoteLoading}
                className="rounded-lg bg-[#0b2a5a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#143a75] transition-colors disabled:opacity-50"
              >
                {promoteLoading ? "Adding…" : "Add to sales pipeline"}
              </button>
            ) : null}
            {type === "job" && hiringEnabled ? (
              <button
                type="button"
                onClick={() => onPromoteToHiring?.(submission)}
                disabled={promoteHiringLoading}
                className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 transition-colors disabled:opacity-50"
              >
                {promoteHiringLoading ? "Adding…" : "Add to hiring pipeline"}
              </button>
            ) : null}
            {type === "contact" && submission?.email ? (
              <button
                onClick={() => onBlockEmail?.(submission.email)}
                className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-200 transition-colors"
              >
                Block Sender
              </button>
            ) : null}
            <button
              onClick={() => {
                onDelete(submission.id);
                onClose();
              }}
              className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 transition-colors"
            >
              Delete Submission
            </button>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactTW() {
  const router = useRouter();
  const { role } = useAuth();
  const pipelineEnabled = canAccessSalesPipeline(role);
  const hiringEnabled = canAccessHiringPipeline(role);
  const [activeTab, setActiveTab] = useState("contact");
  const [contactRows, setContactRows] = useState([]);
  const [jobRows, setJobRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [blockRules, setBlockRules] = useState([]);
  const [newRuleType, setNewRuleType] = useState("email");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [newRuleReason, setNewRuleReason] = useState("");
  const [savingRule, setSavingRule] = useState(false);
  const [showSpamControls, setShowSpamControls] = useState(false);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteHiringLoading, setPromoteHiringLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 10;

  const loadSubmissions = useCallback(async ({ force = false } = {}) => {
    if (!force) {
      const cachedRows = readCachedValue("admin-contact-submissions", SUBMISSIONS_CACHE_TTL_MS);
      const cachedRules = readCachedValue("admin-contact-block-rules", SUBMISSIONS_CACHE_TTL_MS);
      if (cachedRows?.value) {
        setContactRows(Array.isArray(cachedRows.value.contactRows) ? cachedRows.value.contactRows : []);
        setJobRows(Array.isArray(cachedRows.value.jobRows) ? cachedRows.value.jobRows : []);
        setLoading(false);
      }
      if (Array.isArray(cachedRules?.value)) {
        setBlockRules(cachedRules.value);
      }
    } else {
      setRefreshing(true);
      setLoading(true);
    }

    const [contactRes, jobRes] = await Promise.all([
      supabase.from("contact_form").select("*").order("created_at", { ascending: false }),
      supabase.from("job_form").select("*").order("created_at", { ascending: false }),
    ]);
    const nextContactRows = !contactRes.error ? (contactRes.data || []) : [];
    const nextJobRows = !jobRes.error ? (jobRes.data || []) : [];
    setContactRows(nextContactRows);
    setJobRows(nextJobRows);
    writeCachedValue("admin-contact-submissions", {
      contactRows: nextContactRows,
      jobRows: nextJobRows,
    });

    try {
      const ruleResponse = await fetch("/api/spam-blocklist");
      const ruleJson = await ruleResponse.json();
      const nextRules = Array.isArray(ruleJson?.rows) ? ruleJson.rows : [];
      setBlockRules(nextRules);
      writeCachedValue("admin-contact-block-rules", nextRules);
    } catch {
      setBlockRules([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const refreshBlockRules = async () => {
    try {
      const response = await fetch("/api/spam-blocklist");
      const json = await response.json();
      const nextRules = Array.isArray(json?.rows) ? json.rows : [];
      setBlockRules(nextRules);
      writeCachedValue("admin-contact-block-rules", nextRules);
    } catch {
      setBlockRules([]);
    }
  };

  const handleCreateRule = async () => {
    const trimmedValue = newRuleValue.trim();
    if (!trimmedValue || savingRule) return;
    setSavingRule(true);
    try {
      const response = await fetch("/api/spam-blocklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleType: newRuleType,
          ruleValue: trimmedValue,
          reason: newRuleReason.trim(),
        }),
      });
      if (!response.ok) throw new Error("Could not save rule");
      setNewRuleValue("");
      setNewRuleReason("");
      await refreshBlockRules();
    } catch (error) {
      alert(error.message || "Could not save block rule.");
    } finally {
      setSavingRule(false);
    }
  };

  const handleToggleRule = async (id, isActive) => {
    await fetch("/api/spam-blocklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !isActive }),
    });
    await refreshBlockRules();
  };

  const handleDeleteRule = async (id) => {
    if (!confirm("Delete this block rule?")) return;
    await fetch("/api/spam-blocklist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refreshBlockRules();
  };

  const handleBlockSender = async (email) => {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) return;
    await fetch("/api/spam-blocklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleType: "email",
        ruleValue: normalized,
        reason: "Blocked from submissions admin",
      }),
    });
    await refreshBlockRules();
    alert(`Blocked ${normalized}. Future submissions from this sender will be silently accepted but not emailed.`);
  };

  const handleDeleteContact = async (id) => {
    if (!confirm("Delete this submission?")) return;
    await supabase.from("contact_form").delete().eq("id", id);
    setContactRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      writeCachedValue("admin-contact-submissions", {
        contactRows: next,
        jobRows,
      });
      return next;
    });
  };

  const handleDeleteJob = async (id) => {
    if (!confirm("Delete this application?")) return;
    await supabase.from("job_form").delete().eq("id", id);
    setJobRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      writeCachedValue("admin-contact-submissions", {
        contactRows,
        jobRows: next,
      });
      return next;
    });
  };

  const handlePromoteToPipeline = async (submission) => {
    if (!submission || promoteLoading) return;
    setPromoteLoading(true);
    try {
      const payload = buildOpportunityPayloadFromContactSubmission(submission);
      const res = await fetch("/api/sales-opportunities", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not add to sales pipeline.");
        return;
      }
      setSelectedSubmission(null);
      alert("Added to the sales pipeline. You can keep reviewing submissions here or manage it from the assistant chat.");
    } finally {
      setPromoteLoading(false);
    }
  };

  const handlePromoteToHiring = async (submission) => {
    if (!submission || promoteHiringLoading) return;
    setPromoteHiringLoading(true);
    try {
      const payload = buildHiringPayloadFromJobSubmission(submission);
      const res = await fetch("/api/hiring-opportunities", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not add to hiring pipeline.");
        return;
      }
      setSelectedSubmission(null);
      router.push("/admin/hiring");
    } finally {
      setPromoteHiringLoading(false);
    }
  };

  // Filter and paginate
  const filteredJobRows = selectedPosition
    ? jobRows.filter((r) => r.position === selectedPosition)
    : jobRows;

  const currentData = activeTab === "contact" ? contactRows : filteredJobRows;
  const totalPages = Math.ceil(currentData.length / pageSize);
  const paginatedData = currentData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page when switching tabs or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedPosition]);

  const positions = [...new Set(jobRows.map((r) => r.position).filter(Boolean))];
  const activeRuleCount = blockRules.filter((rule) => rule.is_active).length;
  const visibleRuleCount = blockRules.slice(0, 12).length;

  // Quick stats — this week counts
  const weekAgo = Date.now() - 7 * 86400000;
  const thisWeekContacts = contactRows.filter((r) => r.created_at && new Date(r.created_at).getTime() >= weekAgo).length;
  const thisWeekJobs = jobRows.filter((r) => r.created_at && new Date(r.created_at).getTime() >= weekAgo).length;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayContacts = contactRows.filter((r) => r.created_at && new Date(r.created_at).getTime() >= todayStart.getTime()).length;
  const todayJobs = jobRows.filter((r) => r.created_at && new Date(r.created_at).getTime() >= todayStart.getTime()).length;

  const timeAgo = (iso) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <>
      <Head>
        <title>Submissions | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        {/* ── Header ── */}
        <div className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className={`${lato.className} text-2xl font-black text-neutral-900`}>Submissions</h1>
              <p className="mt-1 text-sm text-neutral-500">Leads and applications from the website — review, promote to pipeline, or block.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadSubmissions({ force: true })}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                <svg className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </div>

          {/* At-a-glance pills */}
          {!loading && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {(todayContacts + todayJobs) > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {todayContacts + todayJobs} new today
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-600">
                {thisWeekContacts + thisWeekJobs} this week
              </span>
              {blockRules.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  {activeRuleCount} spam rule{activeRuleCount === 1 ? "" : "s"} active
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="mb-5 flex gap-1 rounded-xl border border-neutral-200 bg-neutral-100/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "contact" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-800"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
            Contact Form
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === "contact" ? "bg-[#0b2a5a] text-white" : "bg-neutral-200 text-neutral-700"}`}>
              {loading ? "—" : contactRows.length}
            </span>
            {thisWeekContacts > 0 && (
              <span className="text-xs font-semibold text-emerald-600">+{thisWeekContacts}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("job")}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "job" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-800"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            Job Applications
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === "job" ? "bg-[#0b2a5a] text-white" : "bg-neutral-200 text-neutral-700"}`}>
              {loading ? "—" : jobRows.length}
            </span>
            {thisWeekJobs > 0 && (
              <span className="text-xs font-semibold text-emerald-600">+{thisWeekJobs}</span>
            )}
          </button>
        </div>

        {/* Filter for Job Applications */}
        {activeTab === "job" && positions.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedPosition("")}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                !selectedPosition ? "border-[#0b2a5a] bg-[#0b2a5a] text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
              }`}
            >
              All positions ({jobRows.length})
            </button>
            {positions.slice(0, 8).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setSelectedPosition(pos)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  selectedPosition === pos ? "border-[#0b2a5a] bg-[#0b2a5a] text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                }`}
              >
                {pos} ({jobRows.filter((r) => r.position === pos).length})
              </button>
            ))}
            {positions.length > 8 && (
              <button
                onClick={() => setSelectedPosition("")}
                className="text-sm text-red-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              <p className="text-lg font-medium">No submissions yet</p>
              <p className="text-sm mt-1">
                {activeTab === "contact" ? "Contact form" : "Job application"} submissions will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    {activeTab === "contact" ? (
                      <tr className="text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Message</th>
                        <th className={`px-4 py-3 ${pipelineEnabled ? "min-w-[140px]" : "w-24"}`}>Actions</th>
                      </tr>
                    ) : (
                      <tr className="text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Position</th>
                        <th className={`px-4 py-3 ${hiringEnabled ? "min-w-[140px]" : "w-24"}`}>Actions</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginatedData.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedSubmission(row)}
                      >
                        <td className="px-4 py-3 text-sm text-neutral-500 whitespace-nowrap">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-neutral-900">
                          {row.name || row.firstName || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600">
                          {row.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {row.number || row.phone || "—"}
                        </td>
                        {activeTab === "contact" ? (
                          <td className="px-4 py-3 text-sm text-neutral-600 max-w-xs truncate" title={row.message}>
                            {row.message ? (row.message.length > 50 ? row.message.substring(0, 50) + "..." : row.message) : "—"}
                          </td>
                        ) : (
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              {row.position || "—"}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedSubmission(row)}
                              className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
                            >
                              View
                            </button>
                            {activeTab === "contact" && pipelineEnabled ? (
                              <button
                                type="button"
                                onClick={() => handlePromoteToPipeline(row)}
                                disabled={promoteLoading}
                                className="rounded-md bg-[#0b2a5a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#143a75] transition-colors disabled:opacity-50"
                              >
                                Sales
                              </button>
                            ) : null}
                            {activeTab === "job" && hiringEnabled ? (
                              <button
                                type="button"
                                onClick={() => handlePromoteToHiring(row)}
                                disabled={promoteHiringLoading}
                                className="rounded-md bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 transition-colors disabled:opacity-50"
                              >
                                Hiring
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-sm text-neutral-600">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, currentData.length)} of {currentData.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-neutral-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowSpamControls((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div>
              <h2 className={`${lato.className} text-lg font-bold text-[#0b2a5a]`}>Safety & spam controls</h2>
              <p className="text-sm text-neutral-600">
                {activeRuleCount} active rule{activeRuleCount === 1 ? "" : "s"} across {blockRules.length} total.
              </p>
            </div>
            <span className="text-sm font-semibold text-neutral-600">{showSpamControls ? "Hide" : "Manage"}</span>
          </button>

          {showSpamControls ? (
            <div className="border-t border-neutral-200 px-4 pb-4 pt-3">
              <p className="mb-3 text-sm text-neutral-600">
                Block specific emails or domains. Blocked senders are silently accepted, but notification emails are skipped.
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[130px_1fr_1fr_auto]">
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value)}
                  className="h-10 rounded-lg border border-neutral-300 px-3 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="domain">Domain</option>
                </select>
                <input
                  value={newRuleValue}
                  onChange={(e) => setNewRuleValue(e.target.value)}
                  placeholder={newRuleType === "domain" ? "example.com" : "name@example.com"}
                  className="h-10 rounded-lg border border-neutral-300 px-3 text-sm"
                />
                <input
                  value={newRuleReason}
                  onChange={(e) => setNewRuleReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="h-10 rounded-lg border border-neutral-300 px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={handleCreateRule}
                  disabled={savingRule || !newRuleValue.trim()}
                  className="h-10 rounded-lg bg-[#0b2a5a] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingRule ? "Saving..." : "Add rule"}
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {blockRules.length === 0 ? (
                  <p className="text-sm text-neutral-500">No blocked senders yet.</p>
                ) : (
                  blockRules.slice(0, 12).map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-900">
                          {rule.rule_type === "domain" ? `@${rule.rule_value}` : rule.rule_value}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {rule.reason || "No reason provided"} {rule.is_active ? "• active" : "• inactive"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule.id, rule.is_active)}
                          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700"
                        >
                          {rule.is_active ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {blockRules.length > visibleRuleCount ? (
                  <p className="text-xs text-neutral-500">
                    Showing first {visibleRuleCount} rules. Narrow old rules from the database if the list grows.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Detail Modal */}
        {selectedSubmission && (
          <SubmissionModal
            submission={selectedSubmission}
            type={activeTab}
            onClose={() => setSelectedSubmission(null)}
            onDelete={activeTab === "contact" ? handleDeleteContact : handleDeleteJob}
            onBlockEmail={handleBlockSender}
            pipelineEnabled={activeTab === "contact" && pipelineEnabled}
            onPromoteToPipeline={handlePromoteToPipeline}
            promoteLoading={promoteLoading}
            hiringEnabled={activeTab === "job" && hiringEnabled}
            onPromoteToHiring={handlePromoteToHiring}
            promoteHiringLoading={promoteHiringLoading}
          />
        )}
      </div>
    </>
  );
}

ContactTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(ContactTW);

