/**
 * GET /api/revenue-reports/generate?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv
 *
 * Builds a Job Detail-style export from revenue_report_jobs in the date range.
 * Columns mirror the existing Job Detail .docx: Date | Job Name | Job # |
 * Location | Revenue | Notes / Status | Crew / Rig.
 *
 * Inserts WEEK TOTAL rows (Mon–Sun ISO weeks) and a Grand Total at the end.
 *
 * Currently only `format=csv` is implemented; CSV opens directly in Excel
 * with proper formatting. XLSX/DOCX can be added without breaking this URL.
 *
 * Dedup: when the same (date, job_number) appears in multiple uploads
 * (e.g., a corrected re-upload of a day's file), we keep the row from the
 * MOST-RECENT upload.
 */
import { createAdminSupabase } from "@/lib/supabase";

const COLUMNS = [
  { key: "report_date", label: "Date" },
  { key: "job_name", label: "Job Name" },
  { key: "job_number", label: "Job #" },
  { key: "location", label: "Location" },
  { key: "revenue", label: "Revenue" },
  { key: "notes", label: "Notes / Status" },
  { key: "crew_rig", label: "Crew / Rig" },
];

const csvEscape = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const formatMoney = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "";
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const formatMDYYYY = (yyyymmdd) => {
  if (!yyyymmdd) return "";
  const [y, m, d] = yyyymmdd.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
};

// ISO-like Monday-anchored week key (YYYY-Www) so weeks group consistently.
const isoWeekKey = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "unknown";
  const day = d.getUTCDay() || 7; // Sunday=7
  // Move to Thursday of the same week (ISO 8601 anchor)
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { from, to, format = "csv" } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: "Missing required query params: from, to (YYYY-MM-DD)" });
  }
  if (format !== "csv") {
    return res.status(400).json({
      error: `Unsupported format "${format}". Currently only "csv" is supported.`,
    });
  }

  const supabase = createAdminSupabase();
  try {
    // Pull rows + uploads in parallel. The uploads table holds each day's
    // canonical "Total: $X" line as day_total, which is what we want to use
    // for week and grand totals — the per-row revenues are imperfect (the
    // model occasionally misses jobs or splits standing amounts wrong) and
    // the user has explicitly asked us to trust the doc's stated total.
    const [rowsRes, uploadsRes] = await Promise.all([
      supabase
        .from("revenue_report_jobs")
        .select(
          "report_date, job_number, job_name, location, revenue, rig_name, crew_names, notes, " +
            "upload:revenue_report_uploads(id, uploaded_at)"
        )
        .gte("report_date", from)
        .lte("report_date", to)
        .order("report_date", { ascending: true }),
      supabase
        .from("revenue_report_uploads")
        .select("report_date, day_total, parsed_revenue_sum, uploaded_at")
        .gte("report_date", from)
        .lte("report_date", to)
        .not("report_date", "is", null),
    ]);
    if (rowsRes.error) throw rowsRes.error;
    if (uploadsRes.error) throw uploadsRes.error;

    // Build the date → canonical day total map. Latest upload per date wins.
    const dayTotalByDate = new Map();
    const uploadLatestByDate = new Map();
    for (const u of uploadsRes.data || []) {
      const existing = uploadLatestByDate.get(u.report_date);
      if (!existing || (u.uploaded_at || "") > (existing.uploaded_at || "")) {
        uploadLatestByDate.set(u.report_date, u);
      }
    }

    // Dedupe rows: prefer the most recently-uploaded row per (date, job_number).
    const dedupMap = new Map();
    for (const r of rowsRes.data || []) {
      const key = `${r.report_date}::${r.job_number || ""}`;
      const uploadedAt = r.upload?.uploaded_at || "9999"; // manual rows beat auto
      const existing = dedupMap.get(key);
      if (!existing || uploadedAt > (existing.upload?.uploaded_at || "9999")) {
        dedupMap.set(key, r);
      }
    }

    const sorted = Array.from(dedupMap.values()).sort((a, b) => {
      if (a.report_date < b.report_date) return -1;
      if (a.report_date > b.report_date) return 1;
      return String(a.job_number || "").localeCompare(String(b.job_number || ""));
    });

    // Compute the canonical revenue PER DATE: prefer day_total from doc,
    // fall back to parsed_revenue_sum, then to summing per-row revenue for
    // dates with manual rows only (no upload).
    const datesInRange = new Set(sorted.map((r) => r.report_date));
    for (const u of uploadLatestByDate.values()) datesInRange.add(u.report_date);

    for (const date of datesInRange) {
      const upload = uploadLatestByDate.get(date);
      if (upload?.day_total != null) {
        dayTotalByDate.set(date, Number(upload.day_total));
        continue;
      }
      if (upload?.parsed_revenue_sum != null) {
        dayTotalByDate.set(date, Number(upload.parsed_revenue_sum));
        continue;
      }
      const sumFromRows = sorted
        .filter((r) => r.report_date === date)
        .reduce((acc, r) => acc + (Number(r.revenue) || 0), 0);
      dayTotalByDate.set(date, sumFromRows);
    }

    // Build CSV output: header row, then grouped-by-week with a WEEK TOTAL
    // (summed from day_totals, not row revenues), then a GRAND TOTAL.
    const lines = [];
    lines.push(COLUMNS.map((c) => csvEscape(c.label)).join(","));

    let currentWeek = null;
    let weekDates = new Set();

    const flushWeekTotal = () => {
      if (currentWeek == null || weekDates.size === 0) return;
      const weekRev = [...weekDates].reduce(
        (acc, d) => acc + (dayTotalByDate.get(d) || 0),
        0
      );
      lines.push(
        ["", "WEEK TOTAL", "", "", csvEscape(formatMoney(weekRev)), "", ""].join(",")
      );
    };

    for (const r of sorted) {
      const week = isoWeekKey(r.report_date);
      if (currentWeek !== null && week !== currentWeek) {
        flushWeekTotal();
        weekDates = new Set();
      }
      currentWeek = week;
      weekDates.add(r.report_date);
      const crewRig = [r.rig_name, r.crew_names].filter(Boolean).join(" • ");
      lines.push(
        [
          csvEscape(formatMDYYYY(r.report_date)),
          csvEscape(r.job_name || ""),
          csvEscape(r.job_number || ""),
          csvEscape(r.location || ""),
          csvEscape(formatMoney(r.revenue)),
          csvEscape(r.notes || ""),
          csvEscape(crewRig),
        ].join(",")
      );
    }
    flushWeekTotal();

    const grandRevenue = [...datesInRange].reduce(
      (acc, d) => acc + (dayTotalByDate.get(d) || 0),
      0
    );

    if (sorted.length > 0 || datesInRange.size > 0) {
      lines.push("");
      lines.push(
        ["", "GRAND TOTAL", "", "", csvEscape(formatMoney(grandRevenue)), "", ""].join(",")
      );
    }

    const csv = lines.join("\r\n");
    const filename = `Job-Detail_${from}_to_${to}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    // BOM so Excel auto-detects UTF-8 (otherwise accented chars break)
    res.status(200).send("﻿" + csv);
  } catch (error) {
    console.error("revenue-reports/generate error:", error);
    return res.status(500).json({ error: error.message || "Generate failed" });
  }
}
