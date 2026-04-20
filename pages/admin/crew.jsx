"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { Lato } from "next/font/google";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { useLiveData } from "@/hooks/useLiveData";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const ROLE_SUGGESTIONS = [
  "Drill Rig Operator",
  "Crane Operator",
  "Ground Hand",
  "Foreman",
  "Superintendent",
  "Oiler",
  "CDL Driver",
  "Welder",
  "Laborer",
  "Safety Officer",
  "Apprentice",
];

const EMPTY_FORM = {
  id: null,
  name: "",
  phone: "",
  role: "",
  is_active: true,
};

function AdminCrewPage() {
  const [workers, setWorkers] = useState([]);
  const [certsByWorker, setCertsByWorker] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [savingId, setSavingId] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("active"); // active | inactive | all

  const [selected, setSelected] = useState(() => new Set());
  const [bulkRoleOpen, setBulkRoleOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [workersResult, certsResult] = await Promise.all([
        supabase.from("crew_workers").select("*").order("name"),
        supabase
          .from("crew_worker_certifications")
          .select("id, worker_id, cert_type, expires_date"),
      ]);
      if (workersResult.error) throw workersResult.error;
      setWorkers(workersResult.data || []);
      // certs table may not exist yet — fall back to empty
      const certRows = certsResult.error ? [] : (certsResult.data || []);
      const byWorker = {};
      certRows.forEach((c) => {
        if (!c.worker_id) return;
        if (!byWorker[c.worker_id]) byWorker[c.worker_id] = [];
        byWorker[c.worker_id].push(c);
      });
      setCertsByWorker(byWorker);
    } catch (err) {
      setErrorMessage(err?.message || "Could not load crew.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useLiveData(loadData, { realtimeTables: ["crew_workers", "crew_worker_certifications"] });

  // Per-role counts for summary cards
  const roleCounts = useMemo(() => {
    const counts = new Map();
    let unassigned = 0;
    let inactive = 0;
    workers.forEach((w) => {
      if (w.is_active === false) {
        inactive += 1;
        return;
      }
      const r = (w.role || "").trim();
      if (!r) {
        unassigned += 1;
      } else {
        counts.set(r, (counts.get(r) || 0) + 1);
      }
    });
    const sortedRoles = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]);
    return { roles: sortedRoles, unassigned, inactive, total: workers.length };
  }, [workers]);

  const filtered = useMemo(() => {
    const searchLc = search.trim().toLowerCase();
    return workers.filter((w) => {
      if (activeFilter === "active" && w.is_active === false) return false;
      if (activeFilter === "inactive" && w.is_active !== false) return false;
      if (roleFilter !== "all") {
        const r = (w.role || "").trim();
        if (roleFilter === "__unassigned__" ? r.length > 0 : r !== roleFilter) return false;
      }
      if (!searchLc) return true;
      return (
        String(w.name || "").toLowerCase().includes(searchLc) ||
        String(w.role || "").toLowerCase().includes(searchLc) ||
        String(w.phone || "").toLowerCase().includes(searchLc)
      );
    });
  }, [workers, search, roleFilter, activeFilter]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((w) => selected.has(w.id));

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        filtered.forEach((w) => next.delete(w.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((w) => next.add(w.id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const applyBulkRole = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0 || !bulkRole.trim()) return;
    setSavingId("bulk");
    try {
      const { error } = await supabase
        .from("crew_workers")
        .update({ role: bulkRole.trim() })
        .in("id", ids);
      if (error) throw error;
      setStatus({ type: "success", message: `Set ${ids.length} crew → ${bulkRole.trim()}` });
      setBulkRoleOpen(false);
      setBulkRole("");
      clearSelection();
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not update roles." });
    } finally {
      setSavingId("");
    }
  };

  const bulkSetActive = async (active) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setSavingId("bulk");
    try {
      const { error } = await supabase
        .from("crew_workers")
        .update({ is_active: active })
        .in("id", ids);
      if (error) throw error;
      setStatus({ type: "success", message: `${active ? "Activated" : "Deactivated"} ${ids.length} crew.` });
      clearSelection();
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not update." });
    } finally {
      setSavingId("");
    }
  };

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (worker) => {
    setForm({
      id: worker.id,
      name: worker.name || "",
      phone: worker.phone || "",
      role: worker.role || "",
      is_active: worker.is_active !== false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setStatus({ type: "error", message: "Name is required." });
      return;
    }
    setSavingId(form.id || "new");
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        role: form.role.trim() || null,
        is_active: Boolean(form.is_active),
      };
      if (form.id) {
        const { error } = await supabase.from("crew_workers").update(payload).eq("id", form.id);
        if (error) throw error;
        setStatus({ type: "success", message: "Crew member updated." });
      } else {
        const { error } = await supabase.from("crew_workers").insert(payload);
        if (error) throw error;
        setStatus({ type: "success", message: "Crew member added." });
      }
      closeModal();
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not save." });
    } finally {
      setSavingId("");
    }
  };

  const toggleWorkerActive = async (worker) => {
    setSavingId(worker.id);
    try {
      const next = !(worker.is_active !== false);
      const { error } = await supabase.from("crew_workers").update({ is_active: next }).eq("id", worker.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not update." });
    } finally {
      setSavingId("");
    }
  };

  const selectedCount = selected.size;

  return (
    <>
      <Head>
        <title>Crew | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <div>
              <h1 className={`${lato.className} text-2xl font-extrabold text-brand leading-tight`}>Crew</h1>
              <p className="mt-0.5 text-sm text-neutral-600">
                Manage workers and their roles. Select multiple to assign a role in one shot.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Crew Member
          </button>
        </div>

        {/* Role summary cards */}
        <div className="mb-5 flex flex-wrap gap-2">
          <SummaryPill
            label="All"
            count={roleCounts.total}
            active={roleFilter === "all" && activeFilter === "all"}
            tone="brand"
            onClick={() => { setRoleFilter("all"); setActiveFilter("all"); }}
          />
          <SummaryPill
            label="Active"
            count={roleCounts.total - roleCounts.inactive}
            active={roleFilter === "all" && activeFilter === "active"}
            tone="emerald"
            onClick={() => { setRoleFilter("all"); setActiveFilter("active"); }}
          />
          <SummaryPill
            label="Inactive"
            count={roleCounts.inactive}
            active={activeFilter === "inactive"}
            tone="neutral"
            onClick={() => { setRoleFilter("all"); setActiveFilter("inactive"); }}
          />
          <span className="h-6 w-px self-center bg-neutral-200" />
          {roleCounts.roles.map(([role, count]) => (
            <SummaryPill
              key={role}
              label={role}
              count={count}
              active={roleFilter === role && activeFilter !== "inactive"}
              tone="blue"
              onClick={() => { setRoleFilter(role); setActiveFilter("active"); }}
            />
          ))}
          {roleCounts.unassigned > 0 ? (
            <SummaryPill
              label="No role"
              count={roleCounts.unassigned}
              active={roleFilter === "__unassigned__"}
              tone="amber"
              onClick={() => { setRoleFilter("__unassigned__"); setActiveFilter("active"); }}
            />
          ) : null}
        </div>

        {/* Search + filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-card">
          <div className="relative flex-1 min-w-[220px]">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, role, phone..."
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <p className="text-xs text-neutral-500">
            Showing {filtered.length} of {workers.length}
          </p>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Bulk actions bar (sticky when selections active) */}
        {selectedCount > 0 ? (
          <div className="sticky top-2 z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/5 px-4 py-3 shadow-card-hover">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {selectedCount}
              </div>
              <p className="text-sm font-semibold text-brand">
                {selectedCount === 1 ? "1 crew member selected" : `${selectedCount} crew members selected`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkRoleOpen((v) => !v)}
                  disabled={savingId === "bulk"}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-light disabled:opacity-60"
                >
                  Assign Role
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {bulkRoleOpen ? (
                  <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border border-neutral-200 bg-white shadow-card-hover z-30">
                    <div className="border-b border-neutral-100 p-2">
                      <input
                        type="text"
                        value={bulkRole}
                        onChange={(e) => setBulkRole(e.target.value)}
                        placeholder="Type a role or pick below..."
                        list="crew-role-suggestions"
                        autoFocus
                        className="h-8 w-full rounded-md border border-neutral-300 px-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {ROLE_SUGGESTIONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setBulkRole(r)}
                          className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-semibold transition-colors ${
                            bulkRole === r
                              ? "bg-brand-50 text-brand"
                              : "text-neutral-700 hover:bg-neutral-50"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-end gap-1 border-t border-neutral-100 p-2">
                      <button
                        type="button"
                        onClick={() => { setBulkRoleOpen(false); setBulkRole(""); }}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={applyBulkRole}
                        disabled={!bulkRole.trim() || savingId === "bulk"}
                        className="rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-light disabled:opacity-60"
                      >
                        Apply to {selectedCount}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => bulkSetActive(true)}
                disabled={savingId === "bulk"}
                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
              >
                Activate
              </button>
              <button
                type="button"
                onClick={() => bulkSetActive(false)}
                disabled={savingId === "bulk"}
                className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 disabled:opacity-60"
              >
                Deactivate
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Clear
              </button>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          {loading && workers.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-neutral-500">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading crew...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-neutral-500">
              {workers.length === 0 ? "No crew members yet. Add one to get started." : "No crew members match your filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
                        aria-label={allVisibleSelected ? "Unselect all visible" : "Select all visible"}
                      />
                    </th>
                    <Th>Name</Th>
                    <Th>Role</Th>
                    <Th>Phone</Th>
                    <Th>Certs</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((worker) => (
                    <WorkerRow
                      key={worker.id}
                      worker={worker}
                      selected={selected.has(worker.id)}
                      onToggleSelect={() => toggleSelect(worker.id)}
                      onEdit={() => openEdit(worker)}
                      onToggleActive={() => toggleWorkerActive(worker)}
                      busy={savingId === worker.id}
                      certs={certsByWorker[worker.id] || []}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {modalOpen ? (
          <CrewFormModal
            form={form}
            saving={Boolean(savingId)}
            onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
            onSubmit={submitForm}
            onCancel={closeModal}
          />
        ) : null}

        <datalist id="crew-role-suggestions">
          {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
        </datalist>

        {status ? (
          <div
            className={`fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-card-hover ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <svg
              className={`mt-0.5 h-4 w-4 shrink-0 ${status.type === "success" ? "text-emerald-600" : "text-red-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {status.type === "success" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
              )}
            </svg>
            <p className="flex-1 text-sm font-medium">{status.message}</p>
            <button
              type="button"
              onClick={() => setStatus(null)}
              className="shrink-0 rounded-md p-0.5 text-current/60 transition-colors hover:bg-black/5 hover:text-current"
              aria-label="Dismiss"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function SummaryPill({ label, count, active, tone = "brand", onClick }) {
  const tones = {
    brand: active ? "bg-brand text-white border-brand" : "bg-white text-neutral-700 border-neutral-200 hover:border-brand/50",
    blue: active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-700 border-blue-100 hover:border-blue-300",
    emerald: active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-700 border-emerald-100 hover:border-emerald-300",
    neutral: active ? "bg-neutral-700 text-white border-neutral-700" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400",
    amber: active ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-amber-100 hover:border-amber-300",
  };
  const cls = tones[tone] || tones.brand;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${cls}`}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-700"}`}>
        {count}
      </span>
    </button>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-500 ${className}`}>
      {children}
    </th>
  );
}

function WorkerRow({ worker, selected, onToggleSelect, onEdit, onToggleActive, busy, certs }) {
  const isActive = worker.is_active !== false;

  // Most-soon cert expiry (if any)
  const soonestExpiry = useMemo(() => {
    let soonest = null;
    certs.forEach((c) => {
      if (!c.expires_date) return;
      const d = new Date(c.expires_date);
      if (!soonest || d < soonest.date) soonest = { date: d, type: c.cert_type };
    });
    return soonest;
  }, [certs]);

  const expiryBadge = useMemo(() => {
    if (!soonestExpiry) return null;
    const diffMs = soonestExpiry.date.getTime() - Date.now();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Expired", cls: "bg-rose-100 text-rose-700" };
    if (days <= 30) return { label: `${days}d`, cls: "bg-amber-100 text-amber-800" };
    if (days <= 60) return { label: `${days}d`, cls: "bg-yellow-100 text-yellow-800" };
    return null;
  }, [soonestExpiry]);

  return (
    <tr className={`transition-colors hover:bg-neutral-50 ${selected ? "bg-brand/5" : ""} ${isActive ? "" : "opacity-60"}`}>
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
          aria-label={`Select ${worker.name}`}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
            {getInitials(worker.name)}
          </div>
          <p className="font-semibold text-neutral-900">{worker.name || "—"}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        {worker.role ? (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
            {worker.role}
          </span>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-neutral-600">
        {worker.phone || "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-neutral-600">{certs.length || "—"}</span>
          {expiryBadge ? (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${expiryBadge.cls}`}>
              {expiryBadge.label}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          isActive ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"
        }`}>
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md px-2 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onToggleActive}
            disabled={busy}
            className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-60"
          >
            {busy ? "..." : isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function CrewFormModal({ form, saving, onChange, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
              {form.id ? "Edit Crew Member" : "Add Crew Member"}
            </h2>
            <p className="text-xs text-neutral-500">Name, contact, and default role.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={onSubmit} className="space-y-3 px-5 py-4">
          <label className="block text-sm font-semibold text-neutral-700">
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Jane Doe"
              required
              autoFocus
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>
          <label className="block text-sm font-semibold text-neutral-700">
            Phone
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="(214) 555-0100"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>
          <label className="block text-sm font-semibold text-neutral-700">
            Default Role
            <input
              type="text"
              value={form.role}
              onChange={(e) => onChange("role", e.target.value)}
              placeholder="Drill Rig Operator"
              list="crew-role-suggestions"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
            <span className="mt-1 block text-[11px] font-normal text-neutral-400">
              Start typing for suggestions. Free-form; any role works.
            </span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(e) => onChange("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
            />
            Active (available for scheduling)
          </label>
        </form>

        <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            onClick={onSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              form.id ? "Save changes" : "Add crew"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/);
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase() || "?";
}

AdminCrewPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(AdminCrewPage);
