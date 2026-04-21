"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const EMPTY_JOB = {
  job_name: "",
  job_number: "",
  dig_tess_number: "",
  customer_name: "",
  hiring_contractor: "",
  hiring_contact_name: "",
  hiring_contact_phone: "",
  hiring_contact_email: "",
  address: "",
  city: "",
  zip: "",
  pm_name: "",
  pm_phone: "",
  default_rig: "",
  crane_required: false,
  is_active: true,
  job_status: "active",
  estimated_days: "",
  mob_days: "",
  actual_days: "",
  actual_mob_days: "",
  pier_count: "",
  scope_description: "",
  bid_amount: "",
  contract_amount: "",
  start_date: "",
  end_date: "",
};

const JOB_STATUSES = [
  { value: "active", label: "Active" },
  { value: "bid", label: "Bid" },
  { value: "awarded", label: "Awarded" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

const STATUS_TONE = {
  active: "bg-blue-100 text-blue-700 border-blue-200",
  bid: "bg-neutral-100 text-neutral-700 border-neutral-200",
  awarded: "bg-sky-100 text-sky-700 border-sky-200",
  scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  on_hold: "bg-neutral-200 text-neutral-700 border-neutral-300",
};

/**
 * JobFormModal — add or edit a crew job.
 *
 * Props:
 *  - isOpen: boolean
 *  - mode: "create" | "edit"
 *  - initialJob: optional job object to prefill (used for edit mode)
 *  - customerNames: string[] for datalist suggestions
 *  - onClose: () => void
 *  - onSave: async (jobDraft) => void  — parent handles create/update + any error toast
 */
export default function JobFormModal({
  isOpen,
  mode = "create",
  initialJob = null,
  customerNames = [],
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_JOB);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Email/text extract state (create mode only)
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractText, setExtractText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [extractedKeys, setExtractedKeys] = useState(() => new Set());
  const [extractNotes, setExtractNotes] = useState("");

  // Auto-assign job number state
  const [assigningNumber, setAssigningNumber] = useState(false);
  const [assignInfo, setAssignInfo] = useState(null); // { block, remaining, match_type } | null
  const [assignError, setAssignError] = useState("");

  // Reset form when modal opens or target changes
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage("");
    setExtractOpen(false);
    setExtractText("");
    setExtractError("");
    setExtractedKeys(new Set());
    setExtractNotes("");
    if (initialJob) {
      setForm({ ...EMPTY_JOB, ...initialJob });
    } else {
      setForm(EMPTY_JOB);
    }
  }, [isOpen, initialJob]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const updateField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const titleLabel = useMemo(() => {
    if (mode === "edit") {
      return `Edit Job${form.job_name ? ` — ${form.job_name}` : ""}`;
    }
    return "New Job";
  }, [mode, form.job_name]);

  const showActuals = form.job_status === "completed" || form.job_status === "in_progress" || form.actual_days || form.actual_mob_days;

  const handleExtract = async () => {
    const trimmed = extractText.trim();
    if (!trimmed) {
      setExtractError("Paste an email, message, or scope text to extract.");
      return;
    }
    setExtracting(true);
    setExtractError("");
    try {
      const response = await fetch("/api/jobs/extract-from-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Could not extract.");
      }
      const fields = data?.fields || {};
      const populated = Array.isArray(data?.populatedKeys) ? data.populatedKeys : [];
      setForm((prev) => {
        const next = { ...prev };
        Object.entries(fields).forEach(([key, value]) => {
          // Only fill if we got a real value; don't wipe user-typed content on empty extract
          if (value === "" || value === null || value === undefined) return;
          if (typeof value === "boolean" && value === false) return;
          next[key] = value;
        });
        return next;
      });
      setExtractedKeys(new Set(populated));
      setExtractNotes(String(data?.notes || ""));
      setExtractOpen(false); // collapse the paste area; user now reviews
    } catch (err) {
      setExtractError(err?.message || "Extract failed.");
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.job_name?.trim()) {
      setErrorMessage("Job name is required.");
      return;
    }
    setSaving(true);
    setErrorMessage("");
    try {
      await onSave?.(form);
      // Parent should close the modal on success
    } catch (err) {
      setErrorMessage(err?.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={() => onClose?.()}
    >
      <div
        className={`${lato.className} flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-modal-title"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="job-modal-title" className="text-lg font-extrabold text-brand leading-tight">{titleLabel}</h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {mode === "edit"
                  ? "Update any field below. Changes save to crew_jobs and propagate live to the board."
                  : "Capture everything now — the scheduler, costs, and client portal all read from these fields."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="shrink-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-6 px-6 py-5">
            {/* ── Extract from Email (create mode only) ── */}
            {mode === "create" ? (
              <ExtractFromEmail
                open={extractOpen}
                setOpen={setExtractOpen}
                text={extractText}
                setText={setExtractText}
                extracting={extracting}
                extractError={extractError}
                extractedCount={extractedKeys.size}
                extractNotes={extractNotes}
                onExtract={handleExtract}
              />
            ) : null}

            {/* ── Basics ── */}
            <Section title="Basics" hint="Core identifiers for this job.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Job Name" required>
                  <input
                    type="text"
                    value={form.job_name}
                    onChange={(e) => updateField("job_name", e.target.value)}
                    placeholder="Goodloe Stadium (Red Oak)"
                    required
                    autoFocus
                    className={inputClass}
                  />
                </Field>
                <Field label="Job Number">
                  <input
                    type="text"
                    value={form.job_number}
                    onChange={(e) => updateField("job_number", e.target.value)}
                    placeholder="2026-042"
                    className={inputClass}
                  />
                </Field>
                <Field label="DigTess #">
                  <input
                    type="text"
                    value={form.dig_tess_number}
                    onChange={(e) => updateField("dig_tess_number", e.target.value)}
                    placeholder="—"
                    className={inputClass}
                  />
                </Field>
                <Field label="Status">
                  <div className="flex items-center gap-2">
                    <select
                      value={form.job_status || "active"}
                      onChange={(e) => updateField("job_status", e.target.value)}
                      className={`${inputClass} flex-1`}
                    >
                      {JOB_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_TONE[form.job_status] || STATUS_TONE.active}`}>
                      {JOB_STATUSES.find((s) => s.value === form.job_status)?.label || "Active"}
                    </span>
                  </div>
                </Field>
                <Field label="Flags" className="lg:col-span-2">
                  <div className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={Boolean(form.crane_required)}
                        onChange={(e) => updateField("crane_required", e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
                      />
                      Crane Required
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={Boolean(form.is_active)}
                        onChange={(e) => updateField("is_active", e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/20"
                      />
                      Active
                    </label>
                  </div>
                </Field>
              </div>
            </Section>

            {/* ── Customer & Site ── */}
            <Section title="Customer & Site" hint="Who the work is for and where it's happening.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Customer Name">
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => updateField("customer_name", e.target.value)}
                    list="job-customer-options"
                    placeholder="Miller Sierra"
                    className={inputClass}
                  />
                </Field>
                <Field label="Hiring Contractor (GC)">
                  <input
                    type="text"
                    value={form.hiring_contractor}
                    onChange={(e) => updateField("hiring_contractor", e.target.value)}
                    list="job-customer-options"
                    placeholder="Acme General Contractors"
                    className={inputClass}
                  />
                </Field>
                <Field label="Contact Name">
                  <input
                    type="text"
                    value={form.hiring_contact_name}
                    onChange={(e) => updateField("hiring_contact_name", e.target.value)}
                    placeholder="John Smith"
                    className={inputClass}
                  />
                </Field>
                <Field label="Contact Phone">
                  <input
                    type="tel"
                    value={form.hiring_contact_phone}
                    onChange={(e) => updateField("hiring_contact_phone", e.target.value)}
                    placeholder="(214) 555-0100"
                    className={inputClass}
                  />
                </Field>
                <Field label="Contact Email">
                  <input
                    type="email"
                    value={form.hiring_contact_email}
                    onChange={(e) => updateField("hiring_contact_email", e.target.value)}
                    placeholder="john@acme.com"
                    className={inputClass}
                  />
                </Field>
                <div />
                <Field label="Address" className="lg:col-span-2">
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="1234 Main St"
                    className={inputClass}
                  />
                </Field>
                <Field label="City">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Dallas"
                    className={inputClass}
                  />
                </Field>
                <Field label="ZIP">
                  <input
                    type="text"
                    value={form.zip}
                    onChange={(e) => updateField("zip", e.target.value)}
                    placeholder="75201"
                    className={inputClass}
                  />
                </Field>
              </div>
              {customerNames.length > 0 ? (
                <datalist id="job-customer-options">
                  {customerNames.map((name) => <option key={name} value={name} />)}
                </datalist>
              ) : null}
            </Section>

            {/* ── S&W Team ── */}
            <Section title="S&W Team" hint="Internal ownership for this job.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="PM Name">
                  <input
                    type="text"
                    value={form.pm_name}
                    onChange={(e) => updateField("pm_name", e.target.value)}
                    placeholder="e.g., James Miller"
                    className={inputClass}
                  />
                </Field>
                <Field label="PM Phone">
                  <input
                    type="tel"
                    value={form.pm_phone}
                    onChange={(e) => updateField("pm_phone", e.target.value)}
                    placeholder="(214) 555-0100"
                    className={inputClass}
                  />
                </Field>
                <Field label="Default Rig">
                  <input
                    type="text"
                    value={form.default_rig}
                    onChange={(e) => updateField("default_rig", e.target.value)}
                    placeholder="Rig 5"
                    className={inputClass}
                  />
                </Field>
              </div>
            </Section>

            {/* ── Scope & Duration ── */}
            <Section title="Scope & Duration" hint="Estimated crew-days drive the Job Costs burn view.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Est. Work Days">
                  <input
                    type="number"
                    min="0"
                    value={form.estimated_days ?? ""}
                    onChange={(e) => updateField("estimated_days", e.target.value)}
                    placeholder="10"
                    className={inputClass}
                  />
                </Field>
                <Field label="Mob Days">
                  <input
                    type="number"
                    min="0"
                    value={form.mob_days ?? ""}
                    onChange={(e) => updateField("mob_days", e.target.value)}
                    placeholder="2"
                    className={inputClass}
                  />
                </Field>
                <Field label="Pier Count">
                  <input
                    type="number"
                    min="0"
                    value={form.pier_count ?? ""}
                    onChange={(e) => updateField("pier_count", e.target.value)}
                    placeholder="120"
                    className={inputClass}
                  />
                </Field>
                <Field label="Scope Description">
                  <input
                    type="text"
                    value={form.scope_description ?? ""}
                    onChange={(e) => updateField("scope_description", e.target.value)}
                    placeholder="e.g., 36&quot; piers, 25ft depth"
                    className={inputClass}
                  />
                </Field>
              </div>
            </Section>

            {/* ── Financial & Dates ── */}
            <Section title="Financial & Dates" hint="Contract amount + COs roll into Client Portal and Job Costs totals.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Bid Amount ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.bid_amount ?? ""}
                    onChange={(e) => updateField("bid_amount", e.target.value)}
                    placeholder="185000"
                    className={inputClass}
                  />
                </Field>
                <Field label="Contract Amount ($)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.contract_amount ?? ""}
                    onChange={(e) => updateField("contract_amount", e.target.value)}
                    placeholder="185000"
                    className={inputClass}
                  />
                </Field>
                <Field label="Start Date">
                  <input
                    type="date"
                    value={form.start_date ?? ""}
                    onChange={(e) => updateField("start_date", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="End Date">
                  <input
                    type="date"
                    value={form.end_date ?? ""}
                    onChange={(e) => updateField("end_date", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </Section>

            {/* ── Actuals (conditional) ── */}
            {showActuals ? (
              <Section title="Actuals" hint="Record real duration for completed work — feeds variance reports.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Actual Work Days">
                    <input
                      type="number"
                      min="0"
                      value={form.actual_days ?? ""}
                      onChange={(e) => updateField("actual_days", e.target.value)}
                      placeholder="11"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Actual Mob Days">
                    <input
                      type="number"
                      min="0"
                      value={form.actual_mob_days ?? ""}
                      onChange={(e) => updateField("actual_mob_days", e.target.value)}
                      placeholder="2"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Section>
            ) : null}

            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {errorMessage}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <footer className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-neutral-100 bg-white px-6 py-3">
            <p className="text-xs text-neutral-500">
              {form.job_name ? null : <span className="text-red-600">Job name required.</span>}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onClose?.()}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.job_name?.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60 disabled:shadow-none"
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
                  mode === "edit" ? "Save Changes" : "Create Job"
                )}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";

function Section({ title, hint, children }) {
  return (
    <section>
      <div className="mb-2.5">
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        {hint ? <p className="mt-0.5 text-[11px] text-neutral-500">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-500">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function ExtractFromEmail({
  open,
  setOpen,
  text,
  setText,
  extracting,
  extractError,
  extractedCount,
  extractNotes,
  onExtract,
}) {
  if (!open) {
    return (
      <div className="rounded-xl border border-dashed border-brand/40 bg-brand/5 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-800">Save typing — paste a bid email</p>
              <p className="text-[11px] text-neutral-500">
                AI fills the form from any email, text message, or RFP excerpt. Review and save.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md"
          >
            Parse Email
          </button>
        </div>
        {extractedCount > 0 ? (
          <div className="mt-3 flex flex-wrap items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-emerald-800">
                AI filled {extractedCount} field{extractedCount === 1 ? "" : "s"} — review below before saving.
              </p>
              {extractNotes ? (
                <p className="mt-0.5 text-[11px] italic text-emerald-700">AI note: {extractNotes}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-purple-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-indigo-900">Paste the email or message</p>
          <p className="text-[11px] text-indigo-700/80">
            AI pulls out job name, customer, GC, address, contact, pier count, scope, and dollar amount.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-indigo-400 transition-colors hover:bg-white/60 hover:text-indigo-700"
          aria-label="Close extract panel"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the email body, scope text, or message here..."
        rows={8}
        autoFocus
        disabled={extracting}
        className="mt-3 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
      />
      {extractError ? (
        <p className="mt-2 text-xs font-semibold text-red-700">{extractError}</p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-indigo-700/70">
          Tip: include subject lines, signatures, and site details — the more context, the better the extraction.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setText(""); }}
            disabled={extracting || !text}
            className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-60"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onExtract}
            disabled={extracting || !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-60"
          >
            {extracting ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Extracting...
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Extract
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
