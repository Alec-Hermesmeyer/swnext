"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { Lato } from "next/font/google";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import supabase from "@/components/Supabase";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const CERT_TYPE_SUGGESTIONS = [
  "OSHA 10",
  "OSHA 30",
  "DOT Medical",
  "CDL-A",
  "CDL-B",
  "DigTess",
  "First Aid / CPR",
  "Fall Protection",
  "Crane Signaler",
  "Operator Certification",
  "Drug Test",
];

const EMPTY_FORM = {
  worker_id: "",
  cert_type: "",
  cert_number: "",
  issuer: "",
  issued_date: "",
  expires_date: "",
  document_url: "",
  notes: "",
};

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const toDisplayDate = (value) => {
  if (!value) return "—";
  const str = String(value);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(`${str}T12:00:00`) : new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const daysUntil = (expiresDate) => {
  if (!expiresDate) return null;
  const str = String(expiresDate);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(`${str}T12:00:00`) : new Date(expiresDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = d.getTime() - today.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const statusFor = (days) => {
  if (days === null) return { label: "No expiry", tone: "neutral", badgeClass: "bg-neutral-100 text-neutral-600" };
  if (days < 0) return { label: "Expired", tone: "rose", badgeClass: "bg-rose-100 text-rose-700" };
  if (days <= 30) return { label: `${days}d`, tone: "amber", badgeClass: "bg-amber-100 text-amber-800" };
  if (days <= 60) return { label: `${days}d`, tone: "yellow", badgeClass: "bg-yellow-100 text-yellow-800" };
  return { label: "Valid", tone: "emerald", badgeClass: "bg-emerald-100 text-emerald-700" };
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "expired", label: "Expired" },
  { value: "expiring_30", label: "Expiring ≤30 days" },
  { value: "expiring_60", label: "Expiring ≤60 days" },
  { value: "valid", label: "Valid" },
  { value: "no_expiry", label: "No expiry" },
];

function CertificationsPage() {
  const [certs, setCerts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [savingId, setSavingId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [certsResult, workersResult] = await Promise.all([
        supabase
          .from("crew_worker_certifications")
          .select("*, crew_workers(id, name, role, phone)")
          .order("expires_date", { ascending: true, nullsFirst: false }),
        supabase.from("crew_workers").select("id, name, role").order("name"),
      ]);
      if (certsResult.error) throw certsResult.error;
      if (workersResult.error) throw workersResult.error;
      setCerts(certsResult.data || []);
      setWorkers(workersResult.data || []);
    } catch (err) {
      setErrorMessage(err?.message || "Could not load certifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enrichedCerts = useMemo(() => {
    return certs.map((c) => {
      const days = daysUntil(c.expires_date);
      return { ...c, days_until_expiry: days, status: statusFor(days) };
    });
  }, [certs]);

  const filteredCerts = useMemo(() => {
    const searchLc = search.trim().toLowerCase();
    return enrichedCerts.filter((c) => {
      // Filter bucket
      if (filter === "expired" && (c.days_until_expiry === null || c.days_until_expiry >= 0)) return false;
      if (filter === "expiring_30" && (c.days_until_expiry === null || c.days_until_expiry < 0 || c.days_until_expiry > 30)) return false;
      if (filter === "expiring_60" && (c.days_until_expiry === null || c.days_until_expiry < 0 || c.days_until_expiry > 60)) return false;
      if (filter === "valid" && (c.days_until_expiry === null || c.days_until_expiry < 0)) return false;
      if (filter === "no_expiry" && c.days_until_expiry !== null) return false;

      if (!searchLc) return true;
      const workerName = c.crew_workers?.name || "";
      const role = c.crew_workers?.role || "";
      return (
        workerName.toLowerCase().includes(searchLc) ||
        role.toLowerCase().includes(searchLc) ||
        String(c.cert_type || "").toLowerCase().includes(searchLc) ||
        String(c.cert_number || "").toLowerCase().includes(searchLc) ||
        String(c.issuer || "").toLowerCase().includes(searchLc)
      );
    });
  }, [enrichedCerts, filter, search]);

  const summary = useMemo(() => {
    let expired = 0;
    let expiring30 = 0;
    let expiring60 = 0;
    let valid = 0;
    enrichedCerts.forEach((c) => {
      if (c.days_until_expiry === null) {
        valid += 1;
      } else if (c.days_until_expiry < 0) {
        expired += 1;
      } else if (c.days_until_expiry <= 30) {
        expiring30 += 1;
      } else if (c.days_until_expiry <= 60) {
        expiring60 += 1;
      } else {
        valid += 1;
      }
    });
    return { expired, expiring30, expiring60, valid, total: enrichedCerts.length };
  }, [enrichedCerts]);

  const openNewForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, issued_date: todayInput() });
    setShowForm(true);
  };

  const openEditForm = (cert) => {
    setEditingId(cert.id);
    setForm({
      worker_id: cert.worker_id || "",
      cert_type: cert.cert_type || "",
      cert_number: cert.cert_number || "",
      issuer: cert.issuer || "",
      issued_date: cert.issued_date || "",
      expires_date: cert.expires_date || "",
      document_url: cert.document_url || "",
      notes: cert.notes || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.worker_id || !form.cert_type) {
      setStatus({ type: "error", message: "Pick a worker and a cert type." });
      return;
    }
    setSavingId(editingId || "new");
    setStatus(null);
    try {
      const payload = {
        worker_id: form.worker_id,
        cert_type: form.cert_type.trim(),
        cert_number: form.cert_number.trim() || null,
        issuer: form.issuer.trim() || null,
        issued_date: form.issued_date || null,
        expires_date: form.expires_date || null,
        document_url: form.document_url.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editingId) {
        const { error } = await supabase.from("crew_worker_certifications").update(payload).eq("id", editingId);
        if (error) throw error;
        setStatus({ type: "success", message: "Certification updated." });
      } else {
        const { error } = await supabase.from("crew_worker_certifications").insert(payload);
        if (error) throw error;
        setStatus({ type: "success", message: "Certification added." });
      }
      closeForm();
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not save." });
    } finally {
      setSavingId("");
    }
  };

  const deleteCert = async (cert) => {
    if (!confirm(`Delete ${cert.cert_type} for ${cert.crew_workers?.name || "this worker"}?`)) return;
    setSavingId(cert.id);
    try {
      const { error } = await supabase.from("crew_worker_certifications").delete().eq("id", cert.id);
      if (error) throw error;
      setStatus({ type: "success", message: "Certification deleted." });
      await loadData();
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Could not delete." });
    } finally {
      setSavingId("");
    }
  };

  return (
    <>
      <Head>
        <title>Certifications | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div>
              <h1 className={`${lato.className} text-2xl font-extrabold text-brand leading-tight`}>Certifications</h1>
              <p className="mt-0.5 text-sm text-neutral-600">
                Track OSHA, DOT, CDL, DigTess and other credentials per crew member.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Certification
          </button>
        </div>

        {/* Summary */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Expired"
            value={summary.expired}
            tone={summary.expired > 0 ? "rose" : "emerald"}
            onClick={() => setFilter("expired")}
          />
          <SummaryCard
            label="Expiring ≤30d"
            value={summary.expiring30}
            tone={summary.expiring30 > 0 ? "amber" : "emerald"}
            onClick={() => setFilter("expiring_30")}
          />
          <SummaryCard
            label="Expiring 31–60d"
            value={summary.expiring60}
            tone={summary.expiring60 > 0 ? "yellow" : "emerald"}
            onClick={() => setFilter("expiring_60")}
          />
          <SummaryCard
            label="Total On File"
            value={summary.total}
            tone="blue"
            onClick={() => setFilter("all")}
          />
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-card">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search worker, cert type, number..."
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-neutral-100 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  filter === f.value
                    ? "bg-white text-brand shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          {loading && filteredCerts.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-neutral-500">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </div>
            </div>
          ) : filteredCerts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-neutral-500">
                {search || filter !== "all" ? "No certifications match your filter." : "No certifications on file yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <tr>
                    <Th>Worker</Th>
                    <Th>Certification</Th>
                    <Th>Issuer</Th>
                    <Th>Issued</Th>
                    <Th>Expires</Th>
                    <Th className="text-center">Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredCerts.map((cert) => (
                    <CertRow
                      key={cert.id}
                      cert={cert}
                      deleting={savingId === cert.id}
                      onEdit={() => openEditForm(cert)}
                      onDelete={() => deleteCert(cert)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm ? (
          <CertFormModal
            form={form}
            editing={Boolean(editingId)}
            workers={workers}
            saving={Boolean(savingId)}
            onChange={updateField}
            onSubmit={submitForm}
            onCancel={closeForm}
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

function SummaryCard({ label, value, tone, onClick }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  const toneClass = tones[tone] || tones.blue;
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
          <p className={`${lato.className} mt-1.5 text-2xl font-black text-neutral-900`}>{value}</p>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${toneClass}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
        </div>
      </div>
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

function CertRow({ cert, deleting, onEdit, onDelete }) {
  const worker = cert.crew_workers || {};
  return (
    <tr className="transition-colors hover:bg-neutral-50">
      <td className="px-4 py-3">
        <p className="font-semibold text-neutral-900">{worker.name || "—"}</p>
        {worker.role ? <p className="text-[11px] text-neutral-500">{worker.role}</p> : null}
      </td>
      <td className="px-4 py-3">
        <p className="font-semibold text-neutral-800">{cert.cert_type}</p>
        {cert.cert_number ? <p className="font-mono text-[11px] text-neutral-500">#{cert.cert_number}</p> : null}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600">{cert.issuer || "—"}</td>
      <td className="px-4 py-3 text-sm tabular-nums text-neutral-600">{toDisplayDate(cert.issued_date)}</td>
      <td className="px-4 py-3 text-sm tabular-nums text-neutral-600">{toDisplayDate(cert.expires_date)}</td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${cert.status.badgeClass}`}>
          {cert.status.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          {cert.document_url ? (
            <a
              href={cert.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-2 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand-50"
            >
              View
            </a>
          ) : null}
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function CertFormModal({ form, editing, workers, saving, onChange, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className={`${lato.className} text-lg font-bold text-neutral-900`}>
              {editing ? "Edit Certification" : "Add Certification"}
            </h2>
            <p className="text-xs text-neutral-500">Enter the card/cert details exactly as printed.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-neutral-700">
              Worker
              <select
                value={form.worker_id}
                onChange={(e) => onChange("worker_id", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                required
              >
                <option value="">Select worker...</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}{w.role ? ` — ${w.role}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              Certification Type
              <input
                type="text"
                value={form.cert_type}
                onChange={(e) => onChange("cert_type", e.target.value)}
                placeholder="OSHA 30"
                list="cert-type-suggestions"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                required
              />
              <datalist id="cert-type-suggestions">
                {CERT_TYPE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-neutral-700">
              Cert / Card Number
              <input
                type="text"
                value={form.cert_number}
                onChange={(e) => onChange("cert_number", e.target.value)}
                placeholder="A1234567"
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              Issuer
              <input
                type="text"
                value={form.issuer}
                onChange={(e) => onChange("issuer", e.target.value)}
                placeholder="Texas DPS, OSHA, etc."
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-neutral-700">
              Issued Date
              <input
                type="date"
                value={form.issued_date}
                onChange={(e) => onChange("issued_date", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
            </label>
            <label className="block text-sm font-semibold text-neutral-700">
              Expires Date
              <input
                type="date"
                value={form.expires_date}
                onChange={(e) => onChange("expires_date", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
              />
              <span className="mt-1 block text-[11px] font-normal text-neutral-400">
                Leave blank if this cert doesn't expire.
              </span>
            </label>
          </div>

          <label className="block text-sm font-semibold text-neutral-700">
            Document URL
            <input
              type="url"
              value={form.document_url}
              onChange={(e) => onChange("document_url", e.target.value)}
              placeholder="https://link-to-scanned-card.jpg"
              className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>

          <label className="block text-sm font-semibold text-neutral-700">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              placeholder="Renewal in progress, waiting on card..."
              className="mt-1 min-h-[70px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </label>
        </form>

        <footer className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
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
              editing ? "Save changes" : "Add cert"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

CertificationsPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(CertificationsPage);
