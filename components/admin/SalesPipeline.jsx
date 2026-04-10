"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { withRetry } from "@/lib/retry";
import { SALES_PIPELINE_STAGES, stageLabel } from "@/lib/sales-pipeline";

const emptyForm = () => ({
  id: null,
  title: "",
  company: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  stage: "qualify",
  value_estimate: "",
  bid_due: "",
  next_follow_up: "",
  owner_name: "",
  notes: "",
  lost_reason: "",
});

function stageBadgeClass(stage) {
  switch (stage) {
    case "qualify":
      return "bg-slate-100 text-slate-800 border-slate-200";
    case "pursuing":
      return "bg-sky-50 text-sky-900 border-sky-200";
    case "quoted":
      return "bg-violet-50 text-violet-900 border-violet-200";
    case "negotiation":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "won":
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
    case "lost":
      return "bg-rose-50 text-rose-900 border-rose-200";
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200";
  }
}

function formatMoney(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}

function formatDate(iso) {
  if (!iso) return "—";
  const s = String(iso).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${m}/${d}/${y}`;
  }
  return iso;
}

export default function SalesPipeline() {
  const { role, accessLevel } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const loadRequestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setError("");
    setLoading(true);
    try {
      const data = await withRetry(async () => {
        const q = stageFilter ? `?stage=${encodeURIComponent(stageFilter)}` : "";
        const res = await fetch(`/api/sales-opportunities${q}`, {
          credentials: "same-origin",
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const nextError = new Error(payload.error || "Could not load pipeline");
          nextError.status = res.status;
          throw nextError;
        }
        return payload;
      }, {
        attempts: 3,
        delayMs: 300,
        backoff: 1.75,
        shouldRetry: (error) => ![400, 401, 403].includes(error?.status),
      });

      if (requestId !== loadRequestRef.current) return;
      setRows(data.opportunities || []);
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      setError(error?.message || "Network error");
      setRows([]);
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false);
      }
    }
  }, [stageFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      id: row.id,
      title: row.title || "",
      company: row.company || "",
      contact_name: row.contact_name || "",
      contact_email: row.contact_email || "",
      contact_phone: row.contact_phone || "",
      stage: row.stage || "qualify",
      value_estimate: row.value_estimate != null ? String(row.value_estimate) : "",
      bid_due: row.bid_due ? String(row.bid_due).slice(0, 10) : "",
      next_follow_up: row.next_follow_up ? String(row.next_follow_up).slice(0, 10) : "",
      owner_name: row.owner_name || "",
      notes: row.notes || "",
      lost_reason: row.lost_reason || "",
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title,
        company: form.company.trim(),
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        stage: form.stage,
        value_estimate: form.value_estimate === "" ? null : form.value_estimate,
        bid_due: form.bid_due || null,
        next_follow_up: form.next_follow_up || null,
        owner_name: form.owner_name.trim(),
        notes: form.notes.trim(),
        lost_reason: form.lost_reason.trim(),
      };
      if (form.id) {
        const res = await fetch("/api/sales-opportunities", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: form.id, ...payload }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Could not save");
          return;
        }
      } else {
        const res = await fetch("/api/sales-opportunities", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Could not create");
          return;
        }
      }
      setModalOpen(false);
      setForm(emptyForm());
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this opportunity?")) return;
    setError("");
    const res = await fetch(`/api/sales-opportunities?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not delete");
      return;
    }
    await load();
  };

  const level = Number(accessLevel) || 3;
  const salesVisibilityNote =
    role === "sales" ? (
      <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        {level >= 3 ? (
          <p>
            <strong>Sales access (Level 3):</strong> You see every team member&apos;s opportunities. New items default to you as owner unless changed.
          </p>
        ) : level === 2 ? (
          <p>
            <strong>Sales access (Level 2):</strong> You see your opportunities and those owned by <strong>Level 1</strong> sales teammates.
          </p>
        ) : (
          <p>
            <strong>Sales access (Level 1):</strong> You see opportunities assigned to you. In chat, ask about a job by name or number — the assistant can search crew jobs or explain if nothing is in the system yet.
          </p>
        )}
      </div>
    ) : null;

  return (
    <div>
      {salesVisibilityNote}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-600">
          Track bids and pursuits before they become won jobs. For historical wins, use the{" "}
          <strong>Won jobs</strong> tab.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm"
            aria-label="Filter by stage"
          >
            <option value="">All stages</option>
            {SALES_PIPELINE_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={openNew}
            className="h-10 rounded-lg bg-[#0b2a5a] px-4 text-sm font-semibold text-white hover:bg-[#143a75]"
          >
            New opportunity
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow">
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-500">Loading pipeline…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No opportunities yet. Add one from a lead in{" "}
            <Link href="/admin/contact" className="font-semibold text-[#0b2a5a] underline">
              Submissions
            </Link>{" "}
            or click <strong>New opportunity</strong>.
          </div>
        ) : (
          <table className="min-w-full table-auto text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
              <tr>
                <th className="p-3 font-semibold">Opportunity</th>
                <th className="p-3 font-semibold">Stage</th>
                <th className="p-3 font-semibold">Owner</th>
                <th className="p-3 font-semibold">Next follow-up</th>
                <th className="p-3 font-semibold">Bid due</th>
                <th className="p-3 font-semibold">Est. value</th>
                <th className="p-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="text-neutral-800">
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100">
                  <td className="max-w-[280px] p-3">
                    <div className="font-semibold text-neutral-900">{row.title}</div>
                    {row.company ? <div className="text-xs text-neutral-500">{row.company}</div> : null}
                    {row.contact_name || row.contact_email || row.contact_phone ? (
                      <div className="mt-1 text-xs text-neutral-600">
                        {[row.contact_name, row.contact_phone, row.contact_email].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 align-top">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stageBadgeClass(row.stage)}`}
                    >
                      {stageLabel(row.stage)}
                    </span>
                  </td>
                  <td className="p-3 align-top text-neutral-700">{row.owner_name || "—"}</td>
                  <td className="p-3 align-top whitespace-nowrap">{formatDate(row.next_follow_up)}</td>
                  <td className="p-3 align-top whitespace-nowrap">{formatDate(row.bid_due)}</td>
                  <td className="p-3 align-top">{formatMoney(row.value_estimate)}</td>
                  <td className="p-3 align-top text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="mr-2 text-[#0b2a5a] font-semibold hover:underline"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(row.id)} className="text-rose-700 font-semibold hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setModalOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setModalOpen(false)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pipeline-modal-title"
          >
            <h2 id="pipeline-modal-title" className="text-lg font-bold text-[#0b2a5a]">
              {form.id ? "Edit opportunity" : "New opportunity"}
            </h2>
            <form onSubmit={save} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Title</label>
                <input
                  required
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Little Elm tower foundations"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Company / GC</label>
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Contact name</label>
                  <input
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Owner (internal)</label>
                  <input
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    value={form.owner_name}
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    placeholder="Estimator name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Email</label>
                  <input
                    type="email"
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Phone</label>
                  <input
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Stage</label>
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                >
                  {SALES_PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} — {s.hint}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Next follow-up</label>
                  <input
                    type="date"
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    value={form.next_follow_up}
                    onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Bid due</label>
                  <input
                    type="date"
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    value={form.bid_due}
                    onChange={(e) => setForm({ ...form, bid_due: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Est. value (USD)</label>
                <input
                  inputMode="decimal"
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  value={form.value_estimate}
                  onChange={(e) => setForm({ ...form, value_estimate: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              {form.stage === "lost" ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Lost reason</label>
                  <input
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    value={form.lost_reason}
                    onChange={(e) => setForm({ ...form, lost_reason: e.target.value })}
                    placeholder="Price, timing, GC, etc."
                  />
                </div>
              ) : null}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Notes</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-10 rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 rounded-lg bg-[#0b2a5a] px-4 text-sm font-semibold text-white hover:bg-[#143a75] disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
