"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { HIRING_PIPELINE_STAGES, hiringStageLabel } from "@/lib/hiring-pipeline";

const emptyForm = () => ({
  id: null,
  title: "",
  applicant_name: "",
  contact_email: "",
  contact_phone: "",
  position_applied: "",
  stage: "new",
  next_follow_up: "",
  notes: "",
  decline_reason: "",
});

function stageBadgeClass(stage) {
  switch (stage) {
    case "new":
      return "bg-slate-100 text-slate-800 border-slate-200";
    case "reviewing":
      return "bg-sky-50 text-sky-900 border-sky-200";
    case "interview":
      return "bg-violet-50 text-violet-900 border-violet-200";
    case "offer":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "hired":
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
    case "declined":
      return "bg-rose-50 text-rose-900 border-rose-200";
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200";
  }
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

export default function HiringPipeline() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const q = stageFilter ? `?stage=${encodeURIComponent(stageFilter)}` : "";
      const res = await fetch(`/api/hiring-opportunities${q}`, { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not load hiring pipeline");
        setRows([]);
        return;
      }
      setRows(data.opportunities || []);
    } catch {
      setError("Network error");
      setRows([]);
    } finally {
      setLoading(false);
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
      applicant_name: row.applicant_name || "",
      contact_email: row.contact_email || "",
      contact_phone: row.contact_phone || "",
      position_applied: row.position_applied || "",
      stage: row.stage || "new",
      next_follow_up: row.next_follow_up ? String(row.next_follow_up).slice(0, 10) : "",
      notes: row.notes || "",
      decline_reason: row.decline_reason || "",
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
        applicant_name: form.applicant_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        position_applied: form.position_applied.trim(),
        stage: form.stage,
        next_follow_up: form.next_follow_up || null,
        notes: form.notes.trim(),
        decline_reason: form.decline_reason.trim(),
      };
      if (form.id) {
        const res = await fetch("/api/hiring-opportunities", {
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
        const res = await fetch("/api/hiring-opportunities", {
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
    if (!confirm("Remove this applicant from the hiring pipeline?")) return;
    setError("");
    const res = await fetch(`/api/hiring-opportunities?id=${encodeURIComponent(id)}`, {
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

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-600">
          Track job applicants through review and interviews. This is separate from the{" "}
          <Link href="/admin/sales" className="font-semibold text-[#0b2a5a] underline">
            sales
          </Link>{" "}
          pipeline.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm"
            aria-label="Filter by stage"
          >
            <option value="">All stages</option>
            {HIRING_PIPELINE_STAGES.map((s) => (
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
            Add applicant
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow">
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No applicants in the pipeline yet. Promote from{" "}
            <Link href="/admin/contact" className="font-semibold text-[#0b2a5a] underline">
              Submissions → Job applications
            </Link>{" "}
            or add manually.
          </div>
        ) : (
          <table className="min-w-full table-auto text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
              <tr>
                <th className="p-3 font-semibold">Applicant / role</th>
                <th className="p-3 font-semibold">Stage</th>
                <th className="p-3 font-semibold">Contact</th>
                <th className="p-3 font-semibold">Next follow-up</th>
                <th className="p-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="text-neutral-800">
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100">
                  <td className="max-w-[280px] p-3">
                    <div className="font-semibold text-neutral-900">{row.title}</div>
                    {row.position_applied ? (
                      <div className="text-xs text-neutral-500">{row.position_applied}</div>
                    ) : null}
                  </td>
                  <td className="p-3 align-top">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stageBadgeClass(row.stage)}`}
                    >
                      {hiringStageLabel(row.stage)}
                    </span>
                  </td>
                  <td className="p-3 align-top text-xs text-neutral-600">
                    {[row.applicant_name, row.contact_phone, row.contact_email].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="p-3 align-top whitespace-nowrap">{formatDate(row.next_follow_up)}</td>
                  <td className="p-3 align-top text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="mr-2 font-semibold text-[#0b2a5a] hover:underline"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(row.id)} className="font-semibold text-rose-700 hover:underline">
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
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hiring-modal-title"
          >
            <h2 id="hiring-modal-title" className="text-lg font-bold text-[#0b2a5a]">
              {form.id ? "Edit applicant" : "Add applicant"}
            </h2>
            <form onSubmit={save} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Title</label>
                <input
                  required
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Crane Operator — Jane Doe"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Applicant name</label>
                  <input
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    value={form.applicant_name}
                    onChange={(e) => setForm({ ...form, applicant_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Position</label>
                  <input
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    value={form.position_applied}
                    onChange={(e) => setForm({ ...form, position_applied: e.target.value })}
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
                  {HIRING_PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} — {s.hint}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Next follow-up</label>
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                  value={form.next_follow_up}
                  onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })}
                />
              </div>
              {form.stage === "declined" ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Decline reason</label>
                  <input
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                    value={form.decline_reason}
                    onChange={(e) => setForm({ ...form, decline_reason: e.target.value })}
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
