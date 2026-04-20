"use client";

import { useMemo, useState } from "react";
import { Lato } from "next/font/google";
import supabase from "@/components/Supabase";
import { parseJobIntakeInput } from "@/lib/jobs-intake";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const HEADER_HINT =
  "Job Name, Job Number, Dig Tess #, Customer, Hiring Contractor, Contact Name, Contact Phone, Contact Email, Address, City, ZIP, PM Name, PM Phone, Default Rig, Crane";

const EXAMPLE_ROW =
  "Goodloe Stadium, 2026-042, , Miller Sierra, Acme GC, John Smith, 214-555-0100, john@acme.com, 1234 Main St, Dallas, 75201, James M, 214-555-0101, Rig 5, No";

/**
 * Paste a spreadsheet, preview rows, import into crew_jobs in one shot.
 */
export default function ImportJobsModal({ isOpen, onClose, onImported, existingJobs = [] }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const existingNumbers = useMemo(() => {
    const s = new Set();
    existingJobs.forEach((j) => {
      if (j.job_number) s.add(String(j.job_number).toLowerCase());
    });
    return s;
  }, [existingJobs]);

  const existingNames = useMemo(() => {
    const s = new Set();
    existingJobs.forEach((j) => {
      if (j.job_name) s.add(String(j.job_name).toLowerCase());
    });
    return s;
  }, [existingJobs]);

  const resetState = () => {
    setText("");
    setPreview(null);
    setErrorMessage("");
  };

  const close = () => {
    if (saving) return;
    resetState();
    onClose?.();
  };

  const doPreview = () => {
    setErrorMessage("");
    const { rows, error, hadHeader } = parseJobIntakeInput(text);
    if (error) {
      setErrorMessage(error);
      setPreview(null);
      return;
    }
    const annotated = rows.map((row) => {
      const existsByNumber = row.job_number && existingNumbers.has(row.job_number.toLowerCase());
      const existsByName = !existsByNumber && row.job_name && existingNames.has(row.job_name.toLowerCase());
      return { ...row, _duplicate: existsByNumber || existsByName };
    });
    setPreview({ rows: annotated, hadHeader });
  };

  const doImport = async () => {
    if (!preview || preview.rows.length === 0) return;
    setSaving(true);
    setErrorMessage("");
    try {
      const toInsert = preview.rows
        .filter((r) => !r._duplicate)
        .map((r) => ({
          job_name: r.job_name,
          job_number: r.job_number || null,
          dig_tess_number: r.dig_tess_number || null,
          customer_name: r.customer_name || null,
          hiring_contractor: r.hiring_contractor || null,
          hiring_contact_name: r.hiring_contact_name || null,
          hiring_contact_phone: r.hiring_contact_phone || null,
          hiring_contact_email: r.hiring_contact_email || null,
          address: r.address || null,
          city: r.city || null,
          zip: r.zip || null,
          pm_name: r.pm_name || null,
          pm_phone: r.pm_phone || null,
          default_rig: r.default_rig || null,
          crane_required: Boolean(r.crane_required),
          is_active: true,
          job_status: "active",
        }));

      const skipped = preview.rows.length - toInsert.length;

      if (toInsert.length === 0) {
        setErrorMessage(skipped > 0
          ? `All ${skipped} row${skipped === 1 ? "" : "s"} already exist. Nothing to import.`
          : "No rows to import.");
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("crew_jobs").insert(toInsert);
      if (error) throw error;

      await onImported?.({ inserted: toInsert.length, skipped });
      resetState();
      onClose?.();
    } catch (err) {
      setErrorMessage(err?.message || "Could not import. Check your data.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const toImportCount = preview ? preview.rows.filter((r) => !r._duplicate).length : 0;
  const dupCount = preview ? preview.rows.length - toImportCount : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={close}
    >
      <div
        className={`${lato.className} flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-brand leading-tight">Import Jobs</h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Paste from Excel, Google Sheets, or a CSV. Headers optional — the parser auto-detects common column names.
              </p>
            </div>
          </div>
          <button type="button" onClick={close} className="shrink-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {preview ? (
            <PreviewTable preview={preview} onEdit={() => setPreview(null)} />
          ) : (
            <PasteArea
              text={text}
              onChange={setText}
              headerHint={HEADER_HINT}
              exampleRow={EXAMPLE_ROW}
            />
          )}

          {errorMessage ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-6 py-3">
          <p className="text-xs text-neutral-500">
            {preview ? (
              <>
                <span className="font-semibold text-neutral-700">{preview.rows.length}</span> row{preview.rows.length === 1 ? "" : "s"} parsed
                {dupCount > 0 ? (
                  <> · <span className="font-semibold text-amber-700">{dupCount} duplicate{dupCount === 1 ? "" : "s"}</span> will skip</>
                ) : null}
                {" · "}
                <span className="font-semibold text-brand">{toImportCount}</span> will import
              </>
            ) : (
              "Paste rows, then click Preview."
            )}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={close} disabled={saving} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-60">
              Cancel
            </button>
            {preview ? (
              <>
                <button type="button" onClick={() => setPreview(null)} disabled={saving} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-60">
                  Back to paste
                </button>
                <button
                  type="button"
                  onClick={doImport}
                  disabled={saving || toImportCount === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60"
                >
                  {saving ? "Importing..." : `Import ${toImportCount} ${toImportCount === 1 ? "job" : "jobs"}`}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={doPreview}
                disabled={!text.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-light hover:shadow-md disabled:opacity-60"
              >
                Preview Rows
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function PasteArea({ text, onChange, headerHint, exampleRow }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-700">
        Paste your spreadsheet
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Optional header line:\n${headerHint}\n\nExample row:\n${exampleRow}`}
          rows={12}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
          autoFocus
        />
      </label>
      <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
        <p className="font-semibold text-neutral-800">Recognized columns (order doesn't matter if you include a header):</p>
        <p className="mt-1 font-mono text-[11px] leading-relaxed text-neutral-500">{headerHint}</p>
      </div>
    </div>
  );
}

function PreviewTable({ preview, onEdit }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-neutral-900">Preview</p>
          <p className="text-[11px] text-neutral-500">
            {preview.hadHeader ? "Header detected — columns mapped by name." : "No header detected — columns mapped by position."}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
        >
          Edit paste
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Status</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Job #</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Job Name</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Customer</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">GC</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">City</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">PM</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Crane</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {preview.rows.map((row, idx) => (
              <tr key={`${row.job_number}-${row.job_name}-${idx}`} className={row._duplicate ? "bg-amber-50/60" : ""}>
                <td className="px-2 py-1.5">
                  {row._duplicate ? (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">Skip</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">New</span>
                  )}
                </td>
                <td className="px-3 py-1.5 font-mono text-[11px]">{row.job_number || <span className="text-neutral-300">—</span>}</td>
                <td className="px-3 py-1.5 font-semibold">{row.job_name}</td>
                <td className="px-3 py-1.5">{row.customer_name || <span className="text-neutral-300">—</span>}</td>
                <td className="px-3 py-1.5">{row.hiring_contractor || <span className="text-neutral-300">—</span>}</td>
                <td className="px-3 py-1.5">{row.city || <span className="text-neutral-300">—</span>}</td>
                <td className="px-3 py-1.5">{row.pm_name || <span className="text-neutral-300">—</span>}</td>
                <td className="px-3 py-1.5">
                  {row.crane_required ? (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">Yes</span>
                  ) : (
                    <span className="text-neutral-400">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
