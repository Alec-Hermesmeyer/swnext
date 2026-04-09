import { useEffect, useState } from "react";
import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import { useAuth } from "@/context/AuthContext";
import { isAdminRole } from "@/lib/roles";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

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

function TeamInsights() {
  const { role: currentRole } = useAuth();
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>
              Team Insights
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              What your team reported through "Teach how I work" — {profiles.length} profile{profiles.length !== 1 ? "s" : ""} collected
            </p>
          </div>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

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
      </div>
    </>
  );
}

TeamInsights.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(TeamInsights);
