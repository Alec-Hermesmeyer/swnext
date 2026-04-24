import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { useAuth } from "@/context/AuthContext";
import { isAdminRole } from "@/lib/roles";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const TYPE_CONFIG = {
  positive: { label: "Positive", icon: "👍", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
  suggestion: { label: "Suggestion", icon: "💡", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-800" },
  negative: { label: "Issue", icon: "⚠️", bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-800" },
};

const formatDateTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
};

function ProfileCard({ profile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`${lato.className} text-lg font-bold text-neutral-900`}>
                {profile.user_name}
              </span>
              {profile.role && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
                  {profile.role}
                </span>
              )}
            </div>
            {profile.role_title && (
              <div className="mt-1 text-sm text-neutral-600">
                Self-described: {profile.role_title}
                {profile.department_name ? ` — ${profile.department_name}` : ""}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {profile.saved_at && (
              <span className="text-[11px] text-neutral-400">
                {new Date(profile.saved_at).toLocaleDateString()}
              </span>
            )}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Preview line when collapsed */}
        {!expanded && profile.primary_goals && (
          <div className="mt-2 truncate text-sm text-neutral-500">
            Goals: {profile.primary_goals}
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 px-5 py-4 space-y-4">
          <InsightField label="Primary Goals" value={profile.primary_goals} accent="blue" />
          <InsightField label="Repetitive Tasks" value={profile.repetitive_tasks} accent="amber" />
          <InsightField label="Biggest Blockers" value={profile.biggest_blockers} accent="red" />
          <InsightField label="Current Tools" value={profile.current_tools} accent="neutral" />
          <InsightField label="Automation Comfort" value={profile.automation_comfort} accent="green" />
        </div>
      )}
    </div>
  );
}

function InsightField({ label, value, accent = "neutral" }) {
  if (!value) return null;

  const colors = {
    blue: "border-blue-200 bg-blue-50",
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
    green: "border-green-200 bg-green-50",
    neutral: "border-neutral-200 bg-neutral-50",
  };

  return (
    <div className={`rounded-lg border p-3 ${colors[accent] || colors.neutral}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1">
        {label}
      </div>
      <div className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">{value}</div>
    </div>
  );
}

// ── Feedback panel ──────────────────────────────────────────────────

function FeedbackPanel({ currentUserName }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pageFilter, setPageFilter] = useState("");
  const [resolvedFilter, setResolvedFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (pageFilter) params.set("page", pageFilter);
      if (resolvedFilter) params.set("resolved", resolvedFilter);
      const res = await fetch(`/api/admin-feedback?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setFeedback(data.feedback || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, pageFilter, resolvedFilter]);

  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  const toggleResolved = useCallback(async (item) => {
    try {
      const res = await fetch("/api/admin-feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          is_resolved: !item.is_resolved,
          resolved_by: currentUserName || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setFeedback((prev) =>
        prev.map((f) => f.id === item.id ? { ...f, is_resolved: !f.is_resolved, resolved_at: !f.is_resolved ? new Date().toISOString() : null } : f)
      );
    } catch (err) {
      alert(err.message);
    }
  }, [currentUserName]);

  const deleteFeedback = useCallback(async (id) => {
    if (!confirm("Delete this feedback?")) return;
    try {
      const res = await fetch(`/api/admin-feedback?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setFeedback((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }, []);

  // Unique pages for filter dropdown
  const uniquePages = useMemo(() => {
    const pages = new Set(feedback.map((f) => f.page).filter(Boolean));
    return Array.from(pages).sort();
  }, [feedback]);

  // Stats
  const stats = useMemo(() => ({
    total: feedback.length,
    positive: feedback.filter((f) => f.type === "positive").length,
    suggestion: feedback.filter((f) => f.type === "suggestion").length,
    negative: feedback.filter((f) => f.type === "negative").length,
    unresolved: feedback.filter((f) => !f.is_resolved).length,
  }), [feedback]);

  return (
    <div>
      {/* Stats row */}
      <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-5">
        <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center shadow-sm">
          <div className={`${lato.className} text-xl font-black text-neutral-900`}>{stats.total}</div>
          <div className="text-[11px] font-semibold text-neutral-500">Total</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center shadow-sm">
          <div className={`${lato.className} text-xl font-black text-emerald-700`}>{stats.positive}</div>
          <div className="text-[11px] font-semibold text-emerald-600">Positive</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center shadow-sm">
          <div className={`${lato.className} text-xl font-black text-amber-700`}>{stats.suggestion}</div>
          <div className="text-[11px] font-semibold text-amber-600">Suggestions</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center shadow-sm">
          <div className={`${lato.className} text-xl font-black text-rose-700`}>{stats.negative}</div>
          <div className="text-[11px] font-semibold text-rose-600">Issues</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center shadow-sm">
          <div className={`${lato.className} text-xl font-black text-blue-700`}>{stats.unresolved}</div>
          <div className="text-[11px] font-semibold text-blue-600">Unresolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-neutral-300 px-3 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">All types</option>
          <option value="positive">Positive</option>
          <option value="suggestion">Suggestion</option>
          <option value="negative">Issue</option>
        </select>
        <select
          value={pageFilter}
          onChange={(e) => setPageFilter(e.target.value)}
          className="h-9 rounded-lg border border-neutral-300 px-3 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">All pages</option>
          {uniquePages.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={resolvedFilter}
          onChange={(e) => setResolvedFilter(e.target.value)}
          className="h-9 rounded-lg border border-neutral-300 px-3 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">All status</option>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
        </select>
        <button
          type="button"
          onClick={loadFeedback}
          disabled={loading}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-neutral-500">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading feedback...
          </div>
        </div>
      ) : feedback.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-neutral-500">No feedback yet. Team members can submit feedback using the button in the header.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feedback.map((item) => {
            const tc = TYPE_CONFIG[item.type] || TYPE_CONFIG.suggestion;
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${item.is_resolved ? "opacity-60" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="mt-0.5 text-lg shrink-0">{tc.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 line-clamp-2">{item.feedback_text}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${tc.badge}`}>{tc.label}</span>
                          <span className="font-mono text-neutral-400">{item.page}</span>
                          <span className="text-neutral-400">{formatDateTime(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.is_resolved && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Resolved</span>
                      )}
                      <svg
                        className={`h-4 w-4 text-neutral-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-neutral-100 px-4 py-3 space-y-3">
                    <div className={`rounded-lg border p-3 ${tc.bg} ${tc.border}`}>
                      <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">{item.feedback_text}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs text-neutral-500">
                      <div>
                        <span className="font-semibold text-neutral-700">Submitted by: </span>
                        {item.user_name || item.user_email || "Anonymous"}
                        {item.user_role ? ` (${item.user_role})` : ""}
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-700">Page: </span>
                        <span className="font-mono">{item.page}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-700">Date: </span>
                        {formatDateTime(item.created_at)}
                      </div>
                      {item.resolved_at && (
                        <div>
                          <span className="font-semibold text-neutral-700">Resolved: </span>
                          {formatDateTime(item.resolved_at)}
                          {item.resolved_by ? ` by ${item.resolved_by}` : ""}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => toggleResolved(item)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          item.is_resolved
                            ? "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {item.is_resolved ? "Mark Unresolved" : "Mark Resolved"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFeedback(item.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamInsights() {
  const { role: currentRole, profile: currentProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("feedback");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/team-insights");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setProfiles(data.profiles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminRole(currentRole)) {
    return (
      <>
        <Head><title>Team Insights | Admin</title><meta name="robots" content="noindex" /></Head>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
          Only Admin (IT) and Owner roles can view team insights.
        </div>
      </>
    );
  }

  // Group by role
  const grouped = {};
  profiles.forEach((p) => {
    const key = p.role || "unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  const withBlockers = profiles.filter((p) => p.biggest_blockers);
  const withRepetitive = profiles.filter((p) => p.repetitive_tasks);

  return (
    <>
      <Head><title>Team Insights | Admin</title><meta name="robots" content="noindex" /></Head>
      <div>
        <div className="mb-6">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>
            Team Insights
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Team feedback, workflow profiles, and automation opportunities
          </p>
        </div>

        {/* Tab navigation */}
        <nav className="mb-6 flex gap-1 border-b border-neutral-200">
          {[
            { id: "feedback", label: "Feedback" },
            { id: "profiles", label: "Workflow Profiles" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === t.id
                  ? "text-[#0b2a5a] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#0b2a5a]"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Feedback tab */}
        {activeTab === "feedback" && (
          <FeedbackPanel currentUserName={currentProfile?.full_name || currentProfile?.username || null} />
        )}

        {/* Profiles tab */}
        {activeTab === "profiles" && (
          <>
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-4 flex justify-end">
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-neutral-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <div className="text-3xl mb-3">📋</div>
            <div className="text-lg font-bold text-neutral-800">No workflow profiles yet</div>
            <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
              When team members use the "Teach how I work" interview in the assistant,
              their responses will appear here so you can identify automation opportunities.
            </p>
          </div>
        ) : (
          <>
            {/* Quick stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-black text-[#0b2a5a]">{profiles.length}</div>
                <div className="text-sm text-neutral-600">Profiles collected</div>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
                <div className="text-2xl font-black text-red-700">{withBlockers.length}</div>
                <div className="text-sm text-red-800">Reported blockers</div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <div className="text-2xl font-black text-amber-700">{withRepetitive.length}</div>
                <div className="text-sm text-amber-800">Have repetitive tasks to automate</div>
              </div>
            </div>

            {/* Blockers summary */}
            {withBlockers.length > 0 && (
              <div className="mb-6 rounded-xl border border-red-200 bg-white p-5">
                <div className={`${lato.className} text-sm font-bold text-red-800 mb-3`}>
                  Blockers across the team
                </div>
                <div className="space-y-2">
                  {withBlockers.map((p) => (
                    <div key={p.user_id} className="rounded-lg bg-red-50 px-3 py-2 text-sm">
                      <span className="font-semibold text-neutral-900">{p.user_name}:</span>{" "}
                      <span className="text-neutral-700">{p.biggest_blockers}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Automation opportunities */}
            {withRepetitive.length > 0 && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-white p-5">
                <div className={`${lato.className} text-sm font-bold text-amber-800 mb-3`}>
                  Repetitive tasks to automate
                </div>
                <div className="space-y-2">
                  {withRepetitive.map((p) => (
                    <div key={p.user_id} className="rounded-lg bg-amber-50 px-3 py-2 text-sm">
                      <span className="font-semibold text-neutral-900">{p.user_name}:</span>{" "}
                      <span className="text-neutral-700">{p.repetitive_tasks}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All profiles grouped by role */}
            {Object.entries(grouped).map(([role, roleProfiles]) => (
              <div key={role} className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`${lato.className} text-sm font-bold uppercase tracking-wide text-[#0b2a5a]`}>
                    {role}
                  </span>
                  <span className="text-xs text-neutral-500">({roleProfiles.length})</span>
                </div>
                <div className="space-y-3">
                  {roleProfiles.map((p) => (
                    <ProfileCard key={p.user_id} profile={p} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
          </>
        )}
      </div>
    </>
  );
}

TeamInsights.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(TeamInsights);
