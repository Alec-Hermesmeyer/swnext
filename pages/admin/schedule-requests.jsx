"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Lato } from "next/font/google";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { notifyRole, notifyUser } from "@/lib/notifications";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const STATUS = [
  { value: "pending", label: "Pending", tone: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  { value: "approved", label: "Approved", tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "scheduled", label: "Scheduled", tone: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "rejected", label: "Rejected", tone: "bg-rose-100 text-rose-700 border-rose-200" },
  { value: "cancelled", label: "Cancelled", tone: "bg-neutral-200 text-neutral-600 border-neutral-300" },
];
const STATUS_META = Object.fromEntries(STATUS.map((s) => [s.value, s]));

const EMPTY_FORM = {
  id: null,
  customer_name: "",
  gc_name: "",
  job_name: "",
  address: "",
  city: "",
  zip: "",
  requested_start_date: "",
  estimated_days: "",
  pier_count: "",
  crane_required: false,
  rig_type: "",
  scope_notes: "",
};

const OPS_ROLES = new Set(["admin", "owner", "operations", "safety"]);
const CAN_DECIDE = (role) => OPS_ROLES.has(String(role || "").toLowerCase());

function ScheduleRequestsPage() {
  const { user, role } = useAuth() || {};
  const canDecide = CAN_DECIDE(role);
  const userEmail = user?.email || null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [savingId, setSavingId] = useState("");

  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionRequest, setDecisionRequest] = useState(null);
  const [decisionType, setDecisionType] = useState("approved"); // approved | rejected
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase
        .from("schedule_requests")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      setErrorMessage(err?.message || "Could not load schedule requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useLiveData(loadData, { realtimeTables: ["schedule_requests"] });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(r.job_name || "").toLowerCase().includes(q) ||
        String(r.customer_name || "").toLowerCase().includes(q) ||
        String(r.gc_name || "").toLowerCase().includes(q) ||
        String(r.city || "").toLowerCase().includes(q) ||
        String(r.requested_by || "").toLowerCase().includes(q)
      );
    });
  }, [rows, statusFilter, search]);

  const summary = useMemo(() => {
    const counts = {};
    STATUS.forEach((s) => { counts[s.value] = 0; });
    rows.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [rows]);

  const openNew = () => { setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (request) => {
    setForm({
      id: request.id,
      customer_name: request.customer_name || "",
      gc_name: request.gc_name || "",
      job_name: request.job_name || "",
      address: request.address || "",
      city: request.city || "",
      zip: request.zip || "",
      requested_start_date: request.requested_start_date || "",
      estimated_days: request.estimated_days ?? "",
      pier_count: request.pier_count ?? "",
      crane_required: Boolean(request.crane_required),
      rig_type: request.rig_type || "",
      scope_notes: request.scope_notes || "",
    });
    setModalOpen(true);
  };

  const closeForm = () => { setModalOpen(false); setForm(EMPTY_FORM); };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.job_name.trim()) {
      setStatus({ type: "error", message: "Job name is required." });
      return;
    }
    setSavingId(form.id || "new");
    try {
      const payload = {
        customer_name: form.customer_name.trim() || null,
        gc_name: form.gc_name.trim() || null,
        job_name: form.job_name.trim(),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        zip: form.zip.trim() || null,
        requested_start_date: form.requested_start_date || null,
        estimated_days: form.estimated_days === "" ? null : Number(form.estimated_days),
        pier_count: form.pier_count === "" ? null : Number(form.pier_count),
        crane_required: Boolean(form.crane_required),
        rig_type: form.rig_type.trim() || null,
        scope_notes: form.scope_notes.trim() || null,
        requested_by: userEmail,
      };
      if (form.id) {
        const { error } = await supabase.from("schedule_requests").update(payload).eq("id", form.id);
        if (error) throw error;
        setStatus({ type: "success", message: "Request updated." });
      } else {
        const { data, error } = await supabase.from("schedule_requests").insert(payload).select().single();
        if (error) throw error;
        setStatus({ type: "success", message: "Request submitted to operations." });
        // Fire notification to operations (fire-and-forget)
        notifyRole("operations", {
          title: `New schedule request: ${payload.job_name}`,
          body: [
            payload.customer_name ? `Customer: ${payload.customer_name}` : null,
            payload.requested_start_date ? `Requested start: ${payload.requested_start_date}` : null,
            payload.estimated_days ? `Est ${payload.estimated_days} days` : null,
          ].filter(Boolean).join(" · "),
          link: "/admin/schedule-requests",
          kind: "schedule_request_created",
          metadata: { request_id: data?.id, requested_by: userEmail },
        });
      }
      closeForm();
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not save." });
    } finally {
      setSavingId("");
    }
  };

  const openDecision = (request, type) => {
    setDecisionRequest(request);
    setDecisionType(type);
    setDecisionDate(request.requested_start_date || "");
    setDecisionNotes("");
    setDecisionOpen(true);
  };

  const closeDecision = () => {
    setDecisionOpen(false);
    setDecisionRequest(null);
  };

  const submitDecision = async (event) => {
    event.preventDefault();
    if (!decisionRequest) return;
    setSavingId(decisionRequest.id);
    try {
      const update = {
        status: decisionType,
        decision_by: userEmail,
        decision_at: new Date().toISOString(),
        decision_notes: decisionNotes.trim() || null,
        scheduled_start_date: decisionType === "approved" ? (decisionDate || null) : null,
      };
      const { error } = await supabase.from("schedule_requests").update(update).eq("id", decisionRequest.id);
      if (error) throw error;
      setStatus({ type: "success", message: decisionType === "approved" ? "Request approved." : "Request rejected." });
      // Notify the requester
      if (decisionRequest.requested_by) {
        const decisionLabel = decisionType === "approved" ? "approved" : "rejected";
        notifyUser(decisionRequest.requested_by, {
          title: `Schedule request ${decisionLabel}: ${decisionRequest.job_name}`,
          body: [
            decisionType === "approved" && decisionDate ? `Scheduled for ${decisionDate}` : null,
            decisionNotes.trim() || null,
          ].filter(Boolean).join(" — ") || null,
          link: "/admin/schedule-requests",
          kind: "schedule_request_decided",
          metadata: { request_id: decisionRequest.id, decision: decisionType, by: userEmail },
        });
      }
      closeDecision();
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not save decision." });
    } finally {
      setSavingId("");
    }
  };

  return (
    <>
      <Head>
        <title>Schedule Requests | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M16.862 4.487 18.549 2.799a2.122 2.122 0 1 1 3 3L19.862 7.487m-3-3L6.34 15.01a4.5 4.5 0 0 0-1.13 1.897l-.869 2.872a.75.75 0 0 0 .933.933l2.872-.869a4.5 4.5 0 0 0 1.897-1.13l10.52-10.52m-3-3 3 3" />
              </svg>
            </div>
            <div>
              <h1 className={`${lato.className} text-2xl font-extrabold text-brand leading-tight`}>Schedule Requests</h1>
              <p className="mt-0.5 text-sm text-neutral-600">
                Sales pitches a start date, operations approves or reschedules.{" "}
                {canDecide ? (
                  <span className="font-semibold text-brand">You can decide on requests.</span>
                ) : (
                  <>Live-synced with <Link href="/admin/crew-scheduler" className="font-semibold text-brand underline">Crew Scheduler</Link>.</>
                )}
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
            New Request
          </button>
        </div>

        {/* Summary pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          <PillButton label="All" count={rows.length} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} tone="brand" />
          {STATUS.map((s) => (
            <PillButton
              key={s.value}
              label={s.label}
              count={summary[s.value] || 0}
              active={statusFilter === s.value}
              onClick={() => setStatusFilter(s.value)}
              tone={s.value}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-card">
          <div className="relative flex-1 min-w-[220px]">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job, customer, GC, city, requester..."
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <p className="text-xs text-neutral-500">
            {filtered.length} of {rows.length}
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          {loading && rows.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-neutral-500">Loading requests...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-neutral-500">
              {rows.length === 0 ? "No schedule requests yet. Tap New Request to submit one." : "No requests match your filters."}
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {filtered.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  canDecide={canDecide && request.status === "pending"}
                  busy={savingId === request.id}
                  onEdit={() => openEdit(request)}
                  onApprove={() => openDecision(request, "approved")}
                  onReject={() => openDecision(request, "rejected")}
                />
              ))}
            </ul>
          )}
        </div>

        {modalOpen ? (
          <RequestFormModal
            form={form}
            saving={Boolean(savingId)}
            onChange={(k, v) => setForm((p) => ({ ...p, [k]: v }))}
            onSubmit={submitForm}
            onCancel={closeForm}
          />
        ) : null}

        {decisionOpen && decisionRequest ? (
          <DecisionModal
            request={decisionRequest}
            type={decisionType}
            setType={setDecisionType}
            date={decisionDate}
            setDate={setDecisionDate}
            notes={decisionNotes}
            setNotes={setDecisionNotes}
            saving={Boolean(savingId)}
            onSubmit={submitDecision}
            onCancel={closeDecision}
          />
        ) : null}

        {status ? (
          <div
            className={`fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-card-hover ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <p className="flex-1 text-sm font-medium">{status.message}</p>
            <button type="button" onClick={() => setStatus(null)} className="shrink-0 rounded-md p-0.5 hover:bg-black/5" aria-label="Dismiss">
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

function PillButton({ label, count, active, onClick, tone = "brand" }) {
  const tones = {
    brand: active ? "bg-brand text-white border-brand" : "bg-white text-neutral-700 border-neutral-200 hover:border-brand/50",
    pending: active ? "bg-neutral-700 text-white border-neutral-700" : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400",
    approved: active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-700 border-emerald-100 hover:border-emerald-300",
    scheduled: active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-700 border-blue-100 hover:border-blue-300",
    rejected: active ? "bg-rose-600 text-white border-rose-600" : "bg-white text-rose-700 border-rose-100 hover:border-rose-300",
    cancelled: active ? "bg-neutral-500 text-white border-neutral-500" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${tones[tone] || tones.brand}`}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-700"}`}>
        {count}
      </span>
    </button>
  );
}

function RequestRow({ request, canDecide, busy, onEdit, onApprove, onReject }) {
  const meta = STATUS_META[request.status] || STATUS_META.pending;
  const requested = request.requested_start_date;
  const scheduled = request.scheduled_start_date;

  return (
    <li className="flex flex-wrap items-start gap-4 px-4 py-4 transition-colors hover:bg-neutral-50">
      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-neutral-900">{request.job_name}</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.tone}`}>
            {meta.label}
          </span>
          {request.crane_required ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">Crane</span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-neutral-600">
          {[request.customer_name, request.gc_name && `GC: ${request.gc_name}`].filter(Boolean).join(" · ") || "No customer"}
        </p>
        {request.city ? <p className="text-[11px] text-neutral-500">{request.city}</p> : null}
        {request.scope_notes ? (
          <p className="mt-1 max-w-2xl text-xs italic text-neutral-600">{request.scope_notes}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-neutral-600 sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Requested</p>
          <p className="font-semibold text-neutral-800">{requested || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Scheduled</p>
          <p className={`font-semibold ${scheduled ? "text-emerald-700" : "text-neutral-400"}`}>
            {scheduled || "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Days</p>
          <p className="font-semibold text-neutral-800">{request.estimated_days || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Piers</p>
          <p className="font-semibold text-neutral-800">{request.pier_count || "—"}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <p className="text-[11px] text-neutral-400">by {request.requested_by || "unknown"}</p>
        <div className="flex items-center gap-1">
          {canDecide ? (
            <>
              <button type="button" onClick={onApprove} disabled={busy} className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60">
                Approve
              </button>
              <button type="button" onClick={onReject} disabled={busy} className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60">
                Reject
              </button>
            </>
          ) : null}
          <button type="button" onClick={onEdit} className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100">
            Edit
          </button>
        </div>
        {request.decision_notes ? (
          <p className="mt-1 max-w-[240px] text-right text-[11px] italic text-neutral-500">
            "{request.decision_notes}"
          </p>
        ) : null}
      </div>
    </li>
  );
}

function RequestFormModal({ form, saving, onChange, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
              {form.id ? "Edit Request" : "New Schedule Request"}
            </h2>
            <p className="text-xs text-neutral-500">Operations will see this immediately and respond.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <Field label="Job Name" required>
            <input type="text" required autoFocus value={form.job_name} onChange={(e) => onChange("job_name", e.target.value)} placeholder="Goodloe Stadium (Red Oak)" className={inputClass} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer">
              <input type="text" value={form.customer_name} onChange={(e) => onChange("customer_name", e.target.value)} placeholder="Miller Sierra" className={inputClass} />
            </Field>
            <Field label="General Contractor">
              <input type="text" value={form.gc_name} onChange={(e) => onChange("gc_name", e.target.value)} placeholder="Acme GC" className={inputClass} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Address" className="sm:col-span-2">
              <input type="text" value={form.address} onChange={(e) => onChange("address", e.target.value)} placeholder="1234 Main St" className={inputClass} />
            </Field>
            <Field label="City">
              <input type="text" value={form.city} onChange={(e) => onChange("city", e.target.value)} placeholder="Dallas" className={inputClass} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Requested Start Date">
              <input type="date" value={form.requested_start_date} onChange={(e) => onChange("requested_start_date", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Est. Days">
              <input type="number" min="0" value={form.estimated_days} onChange={(e) => onChange("estimated_days", e.target.value)} placeholder="10" className={inputClass} />
            </Field>
            <Field label="Pier Count">
              <input type="number" min="0" value={form.pier_count} onChange={(e) => onChange("pier_count", e.target.value)} placeholder="120" className={inputClass} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rig Type">
              <input type="text" value={form.rig_type} onChange={(e) => onChange("rig_type", e.target.value)} placeholder="e.g., Track rig, truck rig" className={inputClass} />
            </Field>
            <label className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700">
              <input type="checkbox" checked={Boolean(form.crane_required)} onChange={(e) => onChange("crane_required", e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20" />
              Crane Required
            </label>
          </div>
          <Field label="Scope Notes">
            <textarea
              value={form.scope_notes}
              onChange={(e) => onChange("scope_notes", e.target.value)}
              placeholder="Any scope detail ops needs to know — access, timing, special equipment, etc."
              className={`${inputClass} min-h-[90px] py-2`}
            />
          </Field>
        </form>

        <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Cancel</button>
          <button type="submit" disabled={saving || !form.job_name.trim()} onClick={onSubmit} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60">
            {saving ? "Saving..." : (form.id ? "Save changes" : "Submit request")}
          </button>
        </footer>
      </div>
    </div>
  );
}

function DecisionModal({ request, type, setType, date, setDate, notes, setNotes, saving, onSubmit, onCancel }) {
  const isApprove = type === "approved";
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
              {isApprove ? "Approve Request" : "Reject Request"}
            </h2>
            <p className="text-xs text-neutral-500">{request.job_name}{request.customer_name ? ` · ${request.customer_name}` : ""}</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={onSubmit} className="space-y-3 px-5 py-4">
          <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setType("approved")}
              className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${type === "approved" ? "bg-emerald-600 text-white shadow-sm" : "text-neutral-700 hover:text-neutral-900"}`}
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => setType("rejected")}
              className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${type === "rejected" ? "bg-rose-600 text-white shadow-sm" : "text-neutral-700 hover:text-neutral-900"}`}
            >
              Reject
            </button>
          </div>

          {isApprove ? (
            <Field label="Committed Start Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              <span className="mt-1 block text-[11px] font-normal text-neutral-400">
                Requested: {request.requested_start_date || "—"}. If you're shifting, explain in notes.
              </span>
            </Field>
          ) : null}

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isApprove ? "Any caveats — crew is swap-out, crane delay risk, etc." : "Reason — conflict with [job], crew unavailable, etc."}
              className={`${inputClass} min-h-[90px] py-2`}
            />
          </Field>
        </form>

        <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Cancel</button>
          <button
            type="submit"
            disabled={saving}
            onClick={onSubmit}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60 ${
              isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {saving ? "Saving..." : isApprove ? "Approve" : "Reject"}
          </button>
        </footer>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";

function Field({ label, required, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
        {label}{required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

ScheduleRequestsPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(ScheduleRequestsPage);
