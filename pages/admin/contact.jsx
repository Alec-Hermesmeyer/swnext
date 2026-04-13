"use client";
import { useEffect, useState } from "react";
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

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

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
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteHiringLoading, setPromoteHiringLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      const [contactRes, jobRes] = await Promise.all([
        supabase.from("contact_form").select("*").order("created_at", { ascending: false }),
        supabase.from("job_form").select("*").order("created_at", { ascending: false }),
      ]);
      if (!contactRes.error) setContactRows(contactRes.data || []);
      if (!jobRes.error) setJobRows(jobRes.data || []);
      try {
        const ruleResponse = await fetch("/api/spam-blocklist");
        const ruleJson = await ruleResponse.json();
        setBlockRules(Array.isArray(ruleJson?.rows) ? ruleJson.rows : []);
      } catch {
        setBlockRules([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const refreshBlockRules = async () => {
    try {
      const response = await fetch("/api/spam-blocklist");
      const json = await response.json();
      setBlockRules(Array.isArray(json?.rows) ? json.rows : []);
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
    setContactRows(contactRows.filter((r) => r.id !== id));
  };

  const handleDeleteJob = async (id) => {
    if (!confirm("Delete this application?")) return;
    await supabase.from("job_form").delete().eq("id", id);
    setJobRows(jobRows.filter((r) => r.id !== id));
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

  return (
    <>
      <Head>
        <title>Submissions | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        <div className="mb-6">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Form Submissions</h1>
          <p className="mt-1 text-sm text-neutral-600">View and manage contact form and job application submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setActiveTab("contact")}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              activeTab === "contact"
                ? "border-red-500 bg-red-50"
                : "border-neutral-200 bg-white hover:border-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Contact Form</p>
                <p className={`${lato.className} text-2xl font-bold text-neutral-900`}>
                  {loading ? "—" : contactRows.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">📧</div>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("job")}
            className={`rounded-xl border-2 p-4 text-left transition-all ${
              activeTab === "job"
                ? "border-red-500 bg-red-50"
                : "border-neutral-200 bg-white hover:border-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500">Job Applications</p>
                <p className={`${lato.className} text-2xl font-bold text-neutral-900`}>
                  {loading ? "—" : jobRows.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">💼</div>
            </div>
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className={`${lato.className} text-lg font-bold text-[#0b2a5a]`}>Spam Blocklist</h2>
            <p className="text-sm text-neutral-600">
              Block specific emails or entire domains. Blocked senders are silently accepted but no notification email is sent.
            </p>
          </div>
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
          </div>
        </div>

        {/* Filter for Job Applications */}
        {activeTab === "job" && positions.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-semibold text-neutral-700">Filter by Position:</label>
            <select
              className="h-9 rounded-lg border border-neutral-300 px-3 text-sm"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="">All Positions ({jobRows.length})</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos} ({jobRows.filter((r) => r.position === pos).length})
                </option>
              ))}
            </select>
            {selectedPosition && (
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

