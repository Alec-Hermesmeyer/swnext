"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { withRetry } from "@/lib/retry";
import { SALES_PIPELINE_STAGES, stageLabel } from "@/lib/sales-pipeline";

const UPCOMING_BID_WINDOW_DAYS = 7;
const CLOSED_STAGES = new Set(["won", "lost"]);

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

function parseDateOnly(value) {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [year, month, day] = s.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayDiff(date, fromDate) {
  if (!date || !fromDate) return null;
  return Math.round((date.getTime() - fromDate.getTime()) / 86400000);
}

function isOpenStage(stage) {
  return !CLOSED_STAGES.has(String(stage || "").trim().toLowerCase());
}

function sortByDateField(rows, field, fallbackField = "updated_at") {
  return [...rows].sort((a, b) => {
    const aDate = parseDateOnly(a?.[field]);
    const bDate = parseDateOnly(b?.[field]);
    if (aDate && bDate) return aDate.getTime() - bDate.getTime();
    if (aDate) return -1;
    if (bDate) return 1;

    const aFallback = new Date(a?.[fallbackField] || 0).getTime();
    const bFallback = new Date(b?.[fallbackField] || 0).getTime();
    return bFallback - aFallback;
  });
}

function buildSearchText(row) {
  return [
    row?.title,
    row?.company,
    row?.contact_name,
    row?.contact_email,
    row?.contact_phone,
    row?.owner_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function relativeDateLabel(dateValue, today) {
  const date = parseDateOnly(dateValue);
  if (!date || !today) return "";
  const diff = dayDiff(date, today);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff}d`;
}

function flagClass(tone) {
  switch (tone) {
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "sky":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
  }
}

function buildOpportunityFlags(row, today) {
  const flags = [];

  if (isOpenStage(row?.stage)) {
    const followUpDate = parseDateOnly(row?.next_follow_up);
    if (followUpDate && followUpDate.getTime() <= today.getTime()) {
      flags.push({ label: "Follow-up due", tone: "amber" });
    }

    const bidDate = parseDateOnly(row?.bid_due);
    const diff = dayDiff(bidDate, today);
    if (diff !== null && diff >= 0 && diff <= UPCOMING_BID_WINDOW_DAYS) {
      flags.push({ label: diff === 0 ? "Bid due today" : "Bid due soon", tone: "sky" });
    }
  }

  if (row?.stage === "won") {
    flags.push({ label: "Ready for ops review", tone: "emerald" });
  }

  return flags;
}

function SummaryCard({ label, value, helper, tone = "neutral" }) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : tone === "sky"
        ? "border-sky-200 bg-sky-50"
        : tone === "emerald"
          ? "border-emerald-200 bg-emerald-50"
          : "border-neutral-200 bg-white";

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-neutral-950">{value}</div>
      <p className="mt-2 text-sm text-neutral-600">{helper}</p>
    </div>
  );
}

function QueueSection({ title, rows, emptyText, countToneClass, detailForRow, onEdit }) {
  const previewRows = rows.slice(0, 4);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#0b2a5a]">{title}</h3>
          <p className="mt-1 text-sm text-neutral-600">{emptyText}</p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${countToneClass}`}>
          {rows.length}
        </div>
      </div>

      {previewRows.length ? (
        <div className="mt-4 space-y-3">
          {previewRows.map((row) => {
            const detail = detailForRow(row);
            return (
              <div key={row.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-neutral-900">{row.title}</div>
                    <div className="mt-1 truncate text-xs text-neutral-600">
                      {[row.company, row.owner_name].filter(Boolean).join(" · ") || "No company or owner yet"}
                    </div>
                  </div>
                  {detail.badge ? (
                    <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${flagClass(detail.tone)}`}>
                      {detail.badge}
                    </span>
                  ) : null}
                </div>
                {detail.meta ? <div className="mt-2 text-xs text-neutral-500">{detail.meta}</div> : null}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="text-sm font-semibold text-[#0b2a5a] hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
          {rows.length > previewRows.length ? (
            <p className="text-xs text-neutral-500">
              {rows.length - previewRows.length} more in the pipeline table below.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function SalesPipeline() {
  const { role, accessLevel } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const loadRequestRef = useRef(0);
  const today = useMemo(() => parseDateOnly(localDateKey()), []);

  const load = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setError("");
    setLoading(true);
    try {
      const data = await withRetry(async () => {
        const res = await fetch("/api/sales-opportunities", {
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return rows.filter((row) => {
      if (stageFilter && row.stage !== stageFilter) return false;
      if (!query) return true;
      return buildSearchText(row).includes(query);
    });
  }, [rows, searchQuery, stageFilter]);

  const openRows = useMemo(
    () => rows.filter((row) => isOpenStage(row.stage)),
    [rows]
  );

  const followUpsDue = useMemo(
    () =>
      sortByDateField(
        openRows.filter((row) => {
          const nextFollowUp = parseDateOnly(row.next_follow_up);
          return nextFollowUp && nextFollowUp.getTime() <= today.getTime();
        }),
        "next_follow_up"
      ),
    [openRows, today]
  );

  const bidsDueSoon = useMemo(
    () =>
      sortByDateField(
        openRows.filter((row) => {
          const bidDate = parseDateOnly(row.bid_due);
          const diff = dayDiff(bidDate, today);
          return diff !== null && diff >= 0 && diff <= UPCOMING_BID_WINDOW_DAYS;
        }),
        "bid_due"
      ),
    [openRows, today]
  );

  const wonQueue = useMemo(
    () => sortByDateField(rows.filter((row) => row.stage === "won"), "updated_at"),
    [rows]
  );

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
      <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-900">
              Sales pilot workflow
            </div>
            <p className="mt-2 text-sm text-sky-950">
              Start small: log every live bid here, keep the next follow-up and bid due dates
              current, then mark awards so operations has a clean handoff queue. That gives sales
              something useful right now without touching the crew scheduler.
            </p>
          </div>
          <Link
            href="/admin/contact"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-sky-300 bg-white px-4 text-sm font-semibold text-sky-950 hover:bg-sky-100"
          >
            Review submissions
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Open pursuits"
          value={openRows.length}
          helper="Everything still in play before the bid is won or lost."
        />
        <SummaryCard
          label="Follow-ups due"
          value={followUpsDue.length}
          helper="Overdue or due-today follow-ups that need sales attention."
          tone="amber"
        />
        <SummaryCard
          label="Bids due in 7 days"
          value={bidsDueSoon.length}
          helper="Near-term bids that should stay visible this week."
          tone="sky"
        />
        <SummaryCard
          label="Won to review"
          value={wonQueue.length}
          helper="Awarded work ready for ops handoff and job setup review."
          tone="emerald"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <QueueSection
          title="Follow-ups due now"
          rows={followUpsDue}
          emptyText="Overdue and due-today follow-ups bubble up here."
          countToneClass="border-amber-200 bg-amber-50 text-amber-900"
          detailForRow={(row) => ({
            badge: relativeDateLabel(row.next_follow_up, today),
            tone: "amber",
            meta: `Follow-up: ${formatDate(row.next_follow_up)}`,
          })}
          onEdit={openEdit}
        />
        <QueueSection
          title="Bids due this week"
          rows={bidsDueSoon}
          emptyText="Anything due in the next 7 days shows here."
          countToneClass="border-sky-200 bg-sky-50 text-sky-900"
          detailForRow={(row) => ({
            badge: relativeDateLabel(row.bid_due, today),
            tone: "sky",
            meta: `Bid due: ${formatDate(row.bid_due)}`,
          })}
          onEdit={openEdit}
        />
        <QueueSection
          title="Won for ops review"
          rows={wonQueue}
          emptyText="Use this queue when a deal is awarded and needs handoff into job tracking."
          countToneClass="border-emerald-200 bg-emerald-50 text-emerald-900"
          detailForRow={(row) => ({
            badge: "Won",
            tone: "emerald",
            meta: `Updated: ${formatDate(row.updated_at)}${row.value_estimate ? ` · ${formatMoney(row.value_estimate)}` : ""}`,
          })}
          onEdit={openEdit}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-600">
          Track bids and pursuits before they become won jobs. For historical wins, use the{" "}
          <strong>Won jobs</strong> tab.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search opportunity, company, contact, owner"
            className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm sm:w-80"
            aria-label="Search opportunities"
          />
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
      <p className="mb-4 text-xs text-neutral-500">
        Showing {filteredRows.length} of {rows.length} opportunities.
      </p>

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
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No opportunities match the current filters. Clear the search or stage filter to see
            the full pipeline.
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
              {filteredRows.map((row) => {
                const flags = buildOpportunityFlags(row, today);
                const followUpDate = parseDateOnly(row.next_follow_up);
                const isDueNow =
                  isOpenStage(row.stage) &&
                  followUpDate &&
                  followUpDate.getTime() <= today.getTime();

                return (
                  <tr
                    key={row.id}
                    className={`border-t border-neutral-100 ${isDueNow ? "bg-amber-50/40" : ""}`}
                  >
                    <td className="max-w-[280px] p-3">
                      <div className="font-semibold text-neutral-900">{row.title}</div>
                      {row.company ? <div className="text-xs text-neutral-500">{row.company}</div> : null}
                      {row.contact_name || row.contact_email || row.contact_phone ? (
                        <div className="mt-1 text-xs text-neutral-600">
                          {[row.contact_name, row.contact_phone, row.contact_email].filter(Boolean).join(" · ")}
                        </div>
                      ) : null}
                      {flags.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {flags.map((flag) => (
                            <span
                              key={`${row.id}-${flag.label}`}
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${flagClass(flag.tone)}`}
                            >
                              {flag.label}
                            </span>
                          ))}
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
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        className="text-rose-700 font-semibold hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
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
