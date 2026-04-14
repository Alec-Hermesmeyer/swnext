import Link from "next/link";
import { useEffect, useState } from "react";

import { SALES_PIPELINE_STAGES, stageLabel } from "@/lib/sales-pipeline";
import { HIRING_PIPELINE_STAGES, hiringStageLabel } from "@/lib/hiring-pipeline";

function buildInitialValues(surface) {
  const initial = {};

  (surface?.fields || []).forEach((field) => {
    if (field.type === "checkbox") {
      initial[field.name] = false;
      return;
    }

    initial[field.name] = "";
  });

  return {
    ...initial,
    ...(surface?.prefill || {}),
  };
}

function renderField(field, value, onChange) {
  const sharedClassName =
    "w-full rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-[#0b2a5a]/18 focus:ring-2 focus:ring-[#0b2a5a]/8";

  if (field.type === "textarea") {
    return (
      <textarea
        rows={4}
        value={value}
        placeholder={field.placeholder || ""}
        onChange={(event) => onChange(field.name, event.target.value)}
        className={`${sharedClassName} resize-y min-h-[120px]`}
      />
    );
  }

  if (field.type === "select") {
    const hasEmptyOption = (field.options || []).some((option) => option.value === "");
    return (
      <select
        value={value}
        onChange={(event) => onChange(field.name, event.target.value)}
        className={sharedClassName}
      >
        {!hasEmptyOption ? (
          <option value="">{field.placeholder || "Select an option"}</option>
        ) : null}
        {(field.options || []).map((option) => (
          <option key={`${field.name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 rounded-[1rem] border border-[#dbe4f0] bg-white px-3 py-3 text-sm font-medium text-neutral-700">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(event) => onChange(field.name, event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-[#0b2a5a] focus:ring-[#0b2a5a]/20"
        />
        <span>{field.label}</span>
      </label>
    );
  }

  return (
    <input
      type={field.type === "email" ? "email" : "text"}
      value={value}
      placeholder={field.placeholder || ""}
      onChange={(event) => onChange(field.name, event.target.value)}
      className={sharedClassName}
    />
  );
}

function renderScheduleOverview(surface) {
  return (
    <div className="px-4 py-4 md:px-5">
      {surface.summary?.length ? (
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          {surface.summary.map((item) => (
            <div
              key={`${surface.id}-${item.label}`}
              className="rounded-[1.15rem] border border-[#e6edf5] bg-white/84 px-4 py-3"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {item.label}
              </div>
              <div className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {surface.days?.length ? (
        <div className="space-y-3">
          {surface.days.map((day) => (
            <div
              key={`${surface.id}-${day.date}`}
              className="rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold tracking-tight text-neutral-950">
                    {day.dateFormatted}
                  </div>
                  <div className="text-xs text-neutral-400">{day.date}</div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    day.finalized
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-[#dbe4f0] bg-[#f7f9fc] text-neutral-500"
                  }`}
                >
                  {day.finalized ? "Finalized" : "Draft"}
                </span>
              </div>

              {day.rigs?.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {day.rigs.map((rigEntry) => (
                    <div
                      key={`${day.date}-${rigEntry.rig}`}
                      className="rounded-[1.05rem] border border-[#edf2f7] bg-[#f8fbff] p-3"
                    >
                      <div className="text-sm font-semibold text-[#0b2a5a]">{rigEntry.rig}</div>
                      <div className="mt-2 space-y-1.5 text-sm leading-6 text-neutral-600">
                        <div>
                          <span className="font-medium text-neutral-900">Jobs:</span>{" "}
                          {(rigEntry.jobs || []).join(", ") || "None"}
                        </div>
                        <div>
                          <span className="font-medium text-neutral-900">Crew:</span>{" "}
                          {(rigEntry.workers || []).join(", ") || "None"}
                        </div>
                        {rigEntry.superintendent ? (
                          <div>
                            <span className="font-medium text-neutral-900">Supt:</span>{" "}
                            {rigEntry.superintendent}
                          </div>
                        ) : null}
                        {rigEntry.truck ? (
                          <div>
                            <span className="font-medium text-neutral-900">Truck:</span>{" "}
                            {rigEntry.truck}
                          </div>
                        ) : null}
                        {rigEntry.notes?.length ? (
                          <div>
                            <span className="font-medium text-neutral-900">Notes:</span>{" "}
                            {rigEntry.notes.join(" / ")}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1rem] border border-dashed border-[#dbe4f0] bg-[#f8fbff] px-4 py-3 text-sm text-neutral-500">
                  No rig assignments are saved for this day yet.
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.2rem] border border-dashed border-[#dbe4f0] bg-white/80 px-4 py-4 text-sm text-neutral-500">
          {surface.emptyMessage || "No live schedule rows matched this request."}
        </div>
      )}

      {surface.tips?.length ? (
        <div className="mt-4 rounded-[1.15rem] border border-[#e6edf5] bg-white/72 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Why this surface exists
          </div>
          <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
            {surface.tips.map((tip) => (
              <div key={tip}>{tip}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderJobIntakeContext(surface) {
  return (
    <div className="px-4 py-4 md:px-5">
      {surface.summary?.length ? (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          {surface.summary.map((item) => (
            <div
              key={`${surface.id}-${item.label}`}
              className="rounded-[1.1rem] border border-[#e6edf5] bg-white/84 px-3 py-3 text-center"
            >
              <div className="text-lg font-bold text-[#0b2a5a]">{item.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {surface.bidSheetFields?.length ? (
        <div className="rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Bid Sheet Fields
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {surface.bidSheetFields.map((field) => (
              <div
                key={field.label}
                className="flex items-start gap-2 rounded-lg border border-[#e6edf5] bg-[#f8fbff] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-neutral-800">
                    {field.label}
                    {field.required ? (
                      <span className="ml-1 text-red-500">*</span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-neutral-500">{field.hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {surface.recentJobs?.length ? (
        <div className="mt-4 rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Recent Jobs
          </div>
          <div className="flex flex-wrap gap-1.5">
            {surface.recentJobs.map((j) => (
              <span
                key={j.name}
                className="rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-2.5 py-1 text-xs font-medium text-neutral-700"
              >
                {j.name}
                {j.number ? ` #${j.number}` : ""}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {surface.tips?.length ? (
        <div className="mt-4 rounded-[1.15rem] border border-[#e6edf5] bg-white/72 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Tips
          </div>
          <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
            {surface.tips.map((tip) => (
              <div key={tip}>{tip}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderScheduleBuilderContext(surface) {
  return (
    <div className="px-4 py-4 md:px-5">
      {surface.summary?.length ? (
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          {surface.summary.map((item) => (
            <div
              key={`${surface.id}-${item.label}`}
              className="rounded-[1.1rem] border border-[#e6edf5] bg-white/84 px-3 py-3 text-center"
            >
              <div className="text-lg font-bold text-[#0b2a5a]">{item.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Crew ({surface.crewList?.length || 0})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(surface.crewList || []).map((w) => (
              <span
                key={w.name}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  w.scheduled
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border border-[#dbe4f0] bg-[#f8fbff] text-neutral-700"
                }`}
              >
                {w.name}
                {w.role ? ` (${w.role})` : ""}
                {w.scheduled ? " ✓" : ""}
              </span>
            ))}
            {!surface.crewList?.length ? (
              <span className="text-sm text-neutral-400">No active crew loaded</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Active Jobs ({surface.jobList?.length || 0})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(surface.jobList || []).map((j) => (
              <span
                key={j.name}
                className="rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-2.5 py-1 text-xs font-medium text-neutral-700"
              >
                {j.name}
                {j.number ? ` #${j.number}` : ""}
              </span>
            ))}
            {!surface.jobList?.length ? (
              <span className="text-sm text-neutral-400">No active jobs loaded</span>
            ) : null}
          </div>
        </div>
      </div>

      {surface.existingRigs?.length ? (
        <div className="mt-4 rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Already scheduled for this date
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {surface.existingRigs.map((rig) => (
              <div key={rig.rig} className="rounded-[1rem] border border-[#e6edf5] bg-white px-3 py-2.5">
                <div className="text-xs font-bold text-[#0b2a5a]">{rig.rig}</div>
                {rig.workers?.length ? (
                  <div className="mt-1 text-xs text-neutral-600">Crew: {rig.workers.join(", ")}</div>
                ) : null}
                {rig.jobs?.length ? (
                  <div className="mt-0.5 text-xs text-neutral-500">Jobs: {rig.jobs.join(", ")}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {surface.tips?.length ? (
        <div className="mt-4 rounded-[1.15rem] border border-[#e6edf5] bg-white/72 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Tips
          </div>
          <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
            {surface.tips.map((tip) => (
              <div key={tip}>{tip}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderCrewJobActivitySurface(surface, activeActionJobId, onToggle) {
  return (
    <div className="px-4 py-4 md:px-5">
      {surface.summary?.length ? (
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {surface.summary.map((item) => (
            <div
              key={`${surface.id}-${item.label}`}
              className="rounded-[1.1rem] border border-[#e6edf5] bg-white/84 px-3 py-3 text-center"
            >
              <div className="text-lg font-bold text-[#0b2a5a]">{item.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {surface.jobs?.length ? (
        <div className="space-y-3">
          {surface.jobs.map((job) => (
            <div
              key={`${surface.id}-${job.id}`}
              className="rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-bold tracking-tight text-neutral-950">
                      {job.name}
                    </div>
                    {job.number ? (
                      <span className="rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                        #{job.number}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                        job.isActive
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-neutral-200 bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {job.isActive ? "Active" : "Inactive"}
                    </span>
                    {job.crane === "Yes" ? (
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                        Crane
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
                    <div>{job.address || "No address saved"}</div>
                    {job.customer ? <div>Customer: {job.customer}</div> : null}
                    {job.hiringContractor ? <div>Hiring: {job.hiringContractor}</div> : null}
                    {job.pm ? <div>PM: {job.pm}</div> : null}
                    {job.defaultRig ? <div>Default rig: {job.defaultRig}</div> : null}
                  </div>
                </div>

                {surface.canToggle ? (
                  <button
                    type="button"
                    onClick={() => onToggle?.(job)}
                    disabled={activeActionJobId === String(job.id)}
                    className={`inline-flex min-w-[126px] items-center justify-center rounded-[0.95rem] px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-55 ${
                      job.isActive
                        ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {activeActionJobId === String(job.id)
                      ? "Updating..."
                      : job.isActive
                        ? "Set Inactive"
                        : "Set Active"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.2rem] border border-dashed border-[#dbe4f0] bg-white/80 px-4 py-4 text-sm text-neutral-500">
          {surface.emptyMessage || "No crew jobs matched this request."}
        </div>
      )}

      {surface.tips?.length ? (
        <div className="mt-4 rounded-[1.15rem] border border-[#e6edf5] bg-white/72 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Why this surface exists
          </div>
          <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
            {surface.tips.map((tip) => (
              <div key={tip}>{tip}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatSalesMoney(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatSalesDate(iso) {
  if (!iso) return "—";
  const s = String(iso).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${m}/${d}/${y}`;
  }
  return String(iso);
}

function stageTone(stage) {
  switch (stage) {
    case "qualify":
      return "border-slate-200 bg-slate-50 text-slate-800";
    case "pursuing":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "quoted":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "negotiation":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "won":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "lost":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-[#dbe4f0] bg-[#f7f9fc] text-neutral-600";
  }
}

function getNextSalesStage(stage) {
  const currentIndex = SALES_PIPELINE_STAGES.findIndex((item) => item.id === stage);
  if (currentIndex === -1) return "";
  return SALES_PIPELINE_STAGES[currentIndex + 1]?.id || "";
}

function renderSalesPipelineList(surface, activeActionKey, onSalesAction) {
  const rows = surface.opportunities || [];
  const canManage = surface.canManage === true && !surface.demoMode;

  return (
    <div className="px-4 py-4 md:px-5">
      {surface.demoMode ? (
        <div className="mb-4 rounded-[1.1rem] border border-dashed border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          Preview mode — these rows are examples only. They are not saved until you add a real opportunity.
        </div>
      ) : null}

      {surface.summary?.length ? (
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {surface.summary.map((item) => (
            <div
              key={`${surface.id}-${item.label}`}
              className="rounded-[1.1rem] border border-[#e6edf5] bg-white/84 px-3 py-3 text-center"
            >
              <div className="text-lg font-bold text-[#0b2a5a]">{item.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => {
            const nextStage = getNextSalesStage(row.stage);
            const editActionKey = `${row.id}:edit`;
            const advanceActionKey = `${row.id}:advance`;
            const wonActionKey = `${row.id}:won`;
            const lostActionKey = `${row.id}:lost`;
            const isClosed = row.stage === "won" || row.stage === "lost";

            return (
              <div
                key={row.id}
                className={`rounded-[1.2rem] border p-4 ${
                  row.isDemo ? "border-dashed border-amber-200/80 bg-white/90" : "border-[#e6edf5] bg-white/84"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold tracking-tight text-neutral-950">{row.title}</div>
                    {row.company ? (
                      <div className="mt-0.5 text-sm text-neutral-600">{row.company}</div>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${stageTone(row.stage)}`}
                  >
                    {stageLabel(row.stage)}
                  </span>
                </div>
                <div className="mt-3 grid gap-1 text-xs text-neutral-500 sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-neutral-700">Est. value:</span>{" "}
                    {formatSalesMoney(row.value_estimate)}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700">Bid due:</span>{" "}
                    {formatSalesDate(row.bid_due)}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700">Follow-up:</span>{" "}
                    {formatSalesDate(row.next_follow_up)}
                  </div>
                  {row.owner_name ? (
                    <div>
                      <span className="font-medium text-neutral-700">Owner:</span> {row.owner_name}
                    </div>
                  ) : null}
                  {row.contact_name ? (
                    <div>
                      <span className="font-medium text-neutral-700">Contact:</span> {row.contact_name}
                    </div>
                  ) : null}
                </div>

                {canManage && !row.isDemo ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onSalesAction?.("edit", row)}
                      disabled={activeActionKey === editActionKey}
                      className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] transition-all hover:border-[#0b2a5a]/30 hover:bg-[#f0f5ff] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {activeActionKey === editActionKey ? "Opening..." : "Edit in chat"}
                    </button>

                    {!isClosed && nextStage && nextStage !== row.stage && nextStage !== "won" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onSalesAction?.("set_stage", row, {
                            stage: nextStage,
                            actionKey: advanceActionKey,
                          })
                        }
                        disabled={activeActionKey === advanceActionKey}
                        className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition-all hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {activeActionKey === advanceActionKey
                          ? "Updating..."
                          : `Move to ${stageLabel(nextStage)}`}
                      </button>
                    ) : null}

                    {!isClosed ? (
                      <button
                        type="button"
                        onClick={() => onSalesAction?.("set_stage", row, { stage: "won", actionKey: wonActionKey })}
                        disabled={activeActionKey === wonActionKey}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {activeActionKey === wonActionKey ? "Updating..." : "Mark won"}
                      </button>
                    ) : null}

                    {!isClosed && row.stage !== "lost" ? (
                      <button
                        type="button"
                        onClick={() => onSalesAction?.("set_stage", row, { stage: "lost", actionKey: lostActionKey })}
                        disabled={activeActionKey === lostActionKey}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {activeActionKey === lostActionKey ? "Updating..." : "Mark lost"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[1.2rem] border border-dashed border-[#dbe4f0] bg-white/80 px-4 py-4 text-sm text-neutral-500">
          {surface.emptyMessage || "No opportunities loaded."}
        </div>
      )}

      {surface.tips?.length ? (
        <div className="mt-4 rounded-[1.15rem] border border-[#e6edf5] bg-white/72 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Why this surface exists
          </div>
          <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
            {surface.tips.map((tip) => (
              <div key={tip}>{tip}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Hiring pipeline helpers ──

function hiringTone(stage) {
  switch (stage) {
    case "new":
      return "border-slate-200 bg-slate-50 text-slate-800";
    case "reviewing":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "interview":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "offer":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "hired":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "declined":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-[#dbe4f0] bg-[#f7f9fc] text-neutral-600";
  }
}

function getNextHiringStage(stage) {
  const idx = HIRING_PIPELINE_STAGES.findIndex((s) => s.id === stage);
  if (idx === -1) return "";
  return HIRING_PIPELINE_STAGES[idx + 1]?.id || "";
}

function renderHiringPipeline(surface, activeActionKey, onHiringAction) {
  const rows = surface.candidates || [];
  const canManage = surface.canManage === true;

  return (
    <div className="px-4 py-4 md:px-5">
      {surface.summary?.length ? (
        <div className="mb-4 grid gap-3 grid-cols-2 md:grid-cols-4">
          {surface.summary.map((item) => (
            <div
              key={`${surface.id}-${item.label}`}
              className="rounded-[1.1rem] border border-[#e6edf5] bg-white/84 px-3 py-3 text-center"
            >
              <div className="text-lg font-bold text-[#0b2a5a]">{item.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => {
            const nextStage = getNextHiringStage(row.stage);
            const editActionKey = `${row.id}:edit`;
            const advanceActionKey = `${row.id}:advance`;
            const hiredActionKey = `${row.id}:hired`;
            const declinedActionKey = `${row.id}:declined`;
            const isClosed = row.stage === "hired" || row.stage === "declined";

            return (
              <div
                key={row.id}
                className="rounded-[1.2rem] border border-[#e6edf5] bg-white/84 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold tracking-tight text-neutral-950">
                      {row.applicant_name || row.title}
                    </div>
                    {row.position_applied ? (
                      <div className="mt-0.5 text-sm text-neutral-600">{row.position_applied}</div>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${hiringTone(row.stage)}`}
                  >
                    {hiringStageLabel(row.stage)}
                  </span>
                </div>
                <div className="mt-3 grid gap-1 text-xs text-neutral-500 sm:grid-cols-2">
                  {row.contact_email ? (
                    <div>
                      <span className="font-medium text-neutral-700">Email:</span> {row.contact_email}
                    </div>
                  ) : null}
                  {row.contact_phone ? (
                    <div>
                      <span className="font-medium text-neutral-700">Phone:</span> {row.contact_phone}
                    </div>
                  ) : null}
                  {row.next_follow_up ? (
                    <div>
                      <span className="font-medium text-neutral-700">Follow-up:</span>{" "}
                      {formatSalesDate(row.next_follow_up)}
                    </div>
                  ) : null}
                  {row.notes ? (
                    <div className="sm:col-span-2">
                      <span className="font-medium text-neutral-700">Notes:</span>{" "}
                      {row.notes.length > 120 ? `${row.notes.substring(0, 120)}...` : row.notes}
                    </div>
                  ) : null}
                </div>

                {canManage ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onHiringAction?.("edit", row)}
                      disabled={activeActionKey === editActionKey}
                      className="rounded-full border border-[#dbe4f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b2a5a] transition-all hover:border-[#0b2a5a]/30 hover:bg-[#f0f5ff] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {activeActionKey === editActionKey ? "Opening..." : "Edit in chat"}
                    </button>

                    {!isClosed && nextStage && nextStage !== row.stage && nextStage !== "hired" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onHiringAction?.("set_stage", row, {
                            stage: nextStage,
                            actionKey: advanceActionKey,
                          })
                        }
                        disabled={activeActionKey === advanceActionKey}
                        className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition-all hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {activeActionKey === advanceActionKey
                          ? "Updating..."
                          : `Move to ${hiringStageLabel(nextStage)}`}
                      </button>
                    ) : null}

                    {!isClosed ? (
                      <button
                        type="button"
                        onClick={() =>
                          onHiringAction?.("set_stage", row, {
                            stage: "hired",
                            actionKey: hiredActionKey,
                          })
                        }
                        disabled={activeActionKey === hiredActionKey}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {activeActionKey === hiredActionKey ? "Updating..." : "Mark hired"}
                      </button>
                    ) : null}

                    {!isClosed && row.stage !== "declined" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onHiringAction?.("set_stage", row, {
                            stage: "declined",
                            actionKey: declinedActionKey,
                          })
                        }
                        disabled={activeActionKey === declinedActionKey}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {activeActionKey === declinedActionKey ? "Declining..." : "Decline"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[1.2rem] border border-dashed border-[#dbe4f0] bg-white/80 px-4 py-4 text-sm text-neutral-500">
          {surface.emptyMessage || "No candidates in the pipeline."}
        </div>
      )}

      {surface.tips?.length ? (
        <div className="mt-4 rounded-[1.15rem] border border-[#e6edf5] bg-white/72 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Pipeline stages
          </div>
          <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
            {surface.tips.map((tip) => (
              <div key={tip}>{tip}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderQuickActions(actions, onQuickAction, onOpenWorkspace) {
  if (!actions?.length) return null;

  return (
    <div className="border-t border-[#e6edf5] px-4 py-3 md:px-5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Quick actions
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          if (action.href) {
            return (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-full border border-[#0b2a5a]/20 bg-[#0b2a5a] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#143a75]"
              >
                {action.label}
              </Link>
            );
          }
          const isWorkspace = action.action === "workspace";
          const handler = isWorkspace
            ? () => onOpenWorkspace?.(action.workspace, action.context || {})
            : () => onQuickAction?.(action.message);

          return (
            <button
              key={action.label}
              type="button"
              onClick={handler}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                isWorkspace
                  ? "border-[#0b2a5a]/20 bg-[#0b2a5a] text-white hover:bg-[#143a75]"
                  : "border-[#dbe4f0] bg-white text-[#0b2a5a] hover:border-[#0b2a5a]/30 hover:bg-[#f0f5ff]"
              }`}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AssistantTaskSurface({
  surface,
  sessionId,
  onComplete,
  onQuickAction,
  onOpenWorkspace,
}) {
  const [values, setValues] = useState(() => buildInitialValues(surface));
  const [submitting, setSubmitting] = useState(false);
  const [activeActionJobId, setActiveActionJobId] = useState("");
  const [activeSalesActionKey, setActiveSalesActionKey] = useState("");
  const [activeHiringActionKey, setActiveHiringActionKey] = useState("");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(!!surface?.completed);
  const [completedMessage, setCompletedMessage] = useState(
    surface?.completed ? "This work surface was already completed in this thread." : ""
  );

  useEffect(() => {
    setValues(buildInitialValues(surface));
    setSubmitting(false);
    setActiveActionJobId("");
    setActiveSalesActionKey("");
    setActiveHiringActionKey("");
    setError("");
    setCompleted(!!surface?.completed);
    setCompletedMessage(
      surface?.completed ? "This work surface was already completed in this thread." : ""
    );
  }, [surface]);

  const handleChange = (name, nextValue) => {
    setValues((current) => ({
      ...current,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !surface?.id || !sessionId) return;

    const missingRequiredField = (surface.fields || []).find((field) => {
      if (!field.required) return false;
      const value = values[field.name];
      return value === "" || value === null || value === undefined;
    });

    if (missingRequiredField) {
      setError(`${missingRequiredField.label} is required.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin-assistant-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          surfaceType: surface.type,
          surfaceId: surface.id,
          values,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not complete assistant action.");
      }

      setCompleted(true);
      setCompletedMessage(data.assistantMessage || surface.successLabel || "Completed.");
      if (typeof onComplete === "function") {
        onComplete({
          surfaceId: surface.id,
          userMessage: data.userMessage,
          assistantMessage: data.assistantMessage,
          actionsPerformed: !!data.actionsPerformed,
          surface: data.surface || null,
        });
      }
    } catch (submitError) {
      setError(submitError.message || "Could not complete assistant action.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrewJobToggle = async (job) => {
    if (!job?.id || !surface?.id || !sessionId || activeActionJobId) return;

    setActiveActionJobId(String(job.id));
    setError("");

    try {
      const response = await fetch("/api/admin-assistant-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          surfaceType: surface.type,
          surfaceId: surface.id,
          values: {
            job_id: job.id,
            job_label: `${job.name}${job.number ? ` (#${job.number})` : ""}`,
            set_active: !job.isActive,
            view: surface.view || "active",
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not complete assistant action.");
      }

      setCompleted(true);
      setCompletedMessage(data.assistantMessage || "Job status updated.");
      if (typeof onComplete === "function") {
        onComplete({
          surfaceId: surface.id,
          userMessage: data.userMessage,
          assistantMessage: data.assistantMessage,
          actionsPerformed: !!data.actionsPerformed,
          surface: data.surface || null,
        });
      }
    } catch (submitError) {
      setError(submitError.message || "Could not complete assistant action.");
    } finally {
      setActiveActionJobId("");
    }
  };

  const handleSalesPipelineAction = async (action, row, extra = {}) => {
    if (!row?.id || !surface?.id || !sessionId || activeSalesActionKey) return;

    const actionKey =
      extra.actionKey || `${row.id}:${action === "set_stage" ? extra.stage || "stage" : action}`;

    setActiveSalesActionKey(actionKey);
    setError("");

    try {
      const response = await fetch("/api/admin-assistant-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          surfaceType: surface.type,
          surfaceId: surface.id,
          values: {
            action,
            opportunity_id: row.id,
            title: row.title,
            stage: extra.stage,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not complete assistant action.");
      }

      if (typeof onComplete === "function") {
        onComplete({
          surfaceId: surface.id,
          userMessage: data.userMessage,
          assistantMessage: data.assistantMessage,
          actionsPerformed: !!data.actionsPerformed,
          surface: data.surface || null,
        });
      }
    } catch (submitError) {
      setError(submitError.message || "Could not complete assistant action.");
    } finally {
      setActiveSalesActionKey("");
    }
  };

  const handleHiringPipelineAction = async (action, row, extra = {}) => {
    if (!row?.id || !surface?.id || !sessionId || activeHiringActionKey) return;

    const actionKey =
      extra.actionKey || `${row.id}:${action === "set_stage" ? extra.stage || "stage" : action}`;

    setActiveHiringActionKey(actionKey);
    setError("");

    try {
      const response = await fetch("/api/admin-assistant-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          surfaceType: surface.type,
          surfaceId: surface.id,
          values: {
            action,
            candidate_id: row.id,
            title: row.title,
            stage: extra.stage,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not complete assistant action.");
      }

      if (typeof onComplete === "function") {
        onComplete({
          surfaceId: surface.id,
          userMessage: data.userMessage,
          assistantMessage: data.assistantMessage,
          actionsPerformed: !!data.actionsPerformed,
          surface: data.surface || null,
        });
      }
    } catch (submitError) {
      setError(submitError.message || "Could not complete assistant action.");
    } finally {
      setActiveHiringActionKey("");
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-[1.55rem] border border-[#dbe4f0] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_16px_42px_rgba(15,23,42,0.05)]">
      <div className="border-b border-[#e6edf5] px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#dbe4f0] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0b2a5a]">
            {surface.module}
          </span>
          {surface.stage ? (
            <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {surface.stage}
            </span>
          ) : null}
          {surface.readOnly ? (
            <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Live view
            </span>
          ) : completed ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Completed
            </span>
          ) : (
            <span className="rounded-full border border-[#dbe4f0] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Interactive surface
            </span>
          )}
        </div>
        <div className="mt-3 text-lg font-bold tracking-tight text-neutral-950">
          {surface.title}
        </div>
        <p className="mt-1 text-sm leading-6 text-neutral-500">{surface.description}</p>
      </div>

      {surface.type === "crew_job_activity_list" && completed ? (
        <div className="px-4 py-4 md:px-5">
          <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            {completedMessage}
          </div>
        </div>
      ) : surface.type === "crew_job_activity_list" ? (
        <>
          {renderCrewJobActivitySurface(surface, activeActionJobId, handleCrewJobToggle)}
          {error ? (
            <div className="px-4 pb-4 md:px-5">
              <div className="rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            </div>
          ) : null}
        </>
      ) : surface.type === "job_intake_context" ? (
        renderJobIntakeContext(surface)
      ) : surface.type === "schedule_builder_context" ? (
        renderScheduleBuilderContext(surface)
      ) : surface.type === "sales_pipeline_list" ? (
        <>
          {renderSalesPipelineList(surface, activeSalesActionKey, handleSalesPipelineAction)}
          {error ? (
            <div className="px-4 pb-4 md:px-5">
              <div className="rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            </div>
          ) : null}
        </>
      ) : surface.readOnly ? (
        renderScheduleOverview(surface)
      ) : completed ? (
        <div className="px-4 py-4 md:px-5">
          <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            {completedMessage}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-4 py-4 md:px-5">
          <div className="grid gap-3 md:grid-cols-2">
            {(surface.fields || []).map((field) => (
              <div
                key={field.name}
                className={field.type === "checkbox" ? "md:col-span-2" : field.span === 2 ? "md:col-span-2" : ""}
              >
                {field.type !== "checkbox" ? (
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                ) : null}
                {renderField(field, values[field.name], handleChange)}
                {field.type === "select" && values[field.name] && field.options?.find((option) => option.value === values[field.name])?.hint ? (
                  <div className="mt-1.5 text-xs text-neutral-400">
                    {field.options.find((option) => option.value === values[field.name]).hint}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {surface.tips?.length ? (
            <div className="mt-4 rounded-[1.15rem] border border-[#e6edf5] bg-white/72 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Why this surface exists
              </div>
              <div className="mt-2 space-y-1 text-sm leading-6 text-neutral-500">
                {surface.tips.map((tip) => (
                  <div key={tip}>{tip}</div>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-neutral-400">
              Saving here updates the live admin data behind the assistant.
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-[1rem] bg-[linear-gradient(180deg,#143a75_0%,#0b2a5a_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(11,42,90,0.18)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : surface.submitLabel || "Save"}
            </button>
          </div>
        </form>
      )}

      {!completed && surface.quickActions?.length ? (
        renderQuickActions(surface.quickActions, onQuickAction, onOpenWorkspace)
      ) : null}
    </div>
  );
}
