/**
 * GET /api/revenue-reports/print?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns a self-contained HTML page styled for both screen preview and
 * print. Users open this in a new tab, verify the data looks right, then
 * use the browser's Print → "Save as PDF" to get a branded PDF without
 * adding a heavyweight server-side PDF library.
 *
 * Same data shape and dedup rules as /generate (CSV) so the two outputs
 * always agree on what's in a given date range.
 */
import { createAdminSupabase } from "@/lib/supabase";

const BRAND_NAVY = "#0b2a5a";
const BRAND_RED = "#dc2626";

const escape = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const formatMDYYYY = (yyyymmdd) => {
  if (!yyyymmdd) return "";
  const [y, m, d] = yyyymmdd.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
};

const formatLongRange = (from, to) => {
  const f = new Date(from + "T12:00:00");
  const t = new Date(to + "T12:00:00");
  const opts = { month: "long", day: "numeric", year: "numeric" };
  return `${f.toLocaleDateString("en-US", opts)} – ${t.toLocaleDateString("en-US", opts)}`;
};

const isoWeekKey = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "unknown";
  const day = d.getUTCDay() || 7;
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }
  const { from, to, autoprint } = req.query;
  if (!from || !to) {
    return res.status(400).send("Missing required query params: from, to (YYYY-MM-DD)");
  }

  const supabase = createAdminSupabase();
  let rows = [];
  let uploads = [];
  try {
    const [rowsRes, uploadsRes] = await Promise.all([
      supabase
        .from("revenue_report_jobs")
        .select(
          "report_date, job_number, job_name, location, revenue, rig_name, crew_names, notes, " +
            "upload:revenue_report_uploads(id, uploaded_at)"
        )
        .gte("report_date", from)
        .lte("report_date", to),
      supabase
        .from("revenue_report_uploads")
        .select("report_date, day_total, parsed_revenue_sum, uploaded_at")
        .gte("report_date", from)
        .lte("report_date", to)
        .not("report_date", "is", null),
    ]);
    if (rowsRes.error) throw rowsRes.error;
    if (uploadsRes.error) throw uploadsRes.error;
    rows = rowsRes.data || [];
    uploads = uploadsRes.data || [];
  } catch (error) {
    console.error("revenue-reports/print error:", error);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(500).send(`<pre>Failed to load: ${escape(error.message)}</pre>`);
  }

  // Dedup (date, job_number) by latest upload (NULL upload_id = manual; treat
  // its "uploaded_at" as Infinity so manual edits always win over auto-parsed).
  const dedupMap = new Map();
  for (const r of rows) {
    const key = `${r.report_date}::${r.job_number || ""}`;
    const stamp = r.upload?.uploaded_at || "9999";
    const existing = dedupMap.get(key);
    if (!existing || stamp > (existing.upload?.uploaded_at || "9999")) {
      dedupMap.set(key, r);
    }
  }
  const sorted = Array.from(dedupMap.values()).sort((a, b) => {
    if (a.report_date < b.report_date) return -1;
    if (a.report_date > b.report_date) return 1;
    return String(a.job_number || "").localeCompare(String(b.job_number || ""));
  });

  // Per-date canonical revenue: prefer day_total (the doc's stated total),
  // fall back to parsed_revenue_sum, then to summing per-row revenue. The
  // user wants the bottom line to come from the doc — the row-level
  // revenues are imperfect and shouldn't drive totals.
  const uploadLatestByDate = new Map();
  for (const u of uploads) {
    const existing = uploadLatestByDate.get(u.report_date);
    if (!existing || (u.uploaded_at || "") > (existing.uploaded_at || "")) {
      uploadLatestByDate.set(u.report_date, u);
    }
  }
  const datesInRange = new Set(sorted.map((r) => r.report_date));
  for (const u of uploadLatestByDate.values()) datesInRange.add(u.report_date);
  const dayTotalByDate = new Map();
  for (const date of datesInRange) {
    const upload = uploadLatestByDate.get(date);
    if (upload?.day_total != null) {
      dayTotalByDate.set(date, Number(upload.day_total));
    } else if (upload?.parsed_revenue_sum != null) {
      dayTotalByDate.set(date, Number(upload.parsed_revenue_sum));
    } else {
      const sumFromRows = sorted
        .filter((r) => r.report_date === date)
        .reduce((acc, r) => acc + (Number(r.revenue) || 0), 0);
      dayTotalByDate.set(date, sumFromRows);
    }
  }

  // Build the body table HTML, inserting WEEK TOTAL rows between weeks.
  const bodyRows = [];
  let currentWeek = null;
  let weekDates = new Set();
  const flushWeek = () => {
    if (currentWeek === null || weekDates.size === 0) return;
    const weekRev = [...weekDates].reduce(
      (acc, d) => acc + (dayTotalByDate.get(d) || 0),
      0
    );
    bodyRows.push(`
      <tr class="week-total">
        <td colspan="4" class="week-total-label">WEEK TOTAL</td>
        <td class="num">${escape(formatMoney(weekRev))}</td>
        <td colspan="2"></td>
      </tr>`);
  };

  for (const r of sorted) {
    const week = isoWeekKey(r.report_date);
    if (currentWeek !== null && week !== currentWeek) {
      flushWeek();
      weekDates = new Set();
    }
    currentWeek = week;
    weekDates.add(r.report_date);
    const crewRig = [r.rig_name, r.crew_names].filter(Boolean).join(" • ");
    bodyRows.push(`
      <tr>
        <td class="nowrap">${escape(formatMDYYYY(r.report_date))}</td>
        <td>${escape(r.job_name || "—")}</td>
        <td class="nowrap mono">${escape(r.job_number || "—")}</td>
        <td>${escape(r.location || "—")}</td>
        <td class="num">${escape(formatMoney(r.revenue))}</td>
        <td>${escape(r.notes || "")}</td>
        <td>${escape(crewRig)}</td>
      </tr>`);
  }
  flushWeek();

  const grandRevenue = [...datesInRange].reduce(
    (acc, d) => acc + (dayTotalByDate.get(d) || 0),
    0
  );

  const dayCount = new Set(sorted.map((r) => r.report_date)).size;
  const jobCount = sorted.length;
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const empty = sorted.length === 0;
  const autoprintScript = autoprint
    ? `<script>window.addEventListener("load", () => setTimeout(() => window.print(), 350));</script>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Job Detail · ${escape(formatLongRange(from, to))}</title>
<style>
  :root {
    --brand-navy: ${BRAND_NAVY};
    --brand-red: ${BRAND_RED};
    --ink: #1a1a1a;
    --muted: #6b7280;
    --line: #e5e7eb;
    --soft: #f8fafc;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f3f4f6;
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 11px;
    line-height: 1.4;
  }
  .toolbar {
    position: sticky; top: 0; z-index: 10;
    display: flex; gap: 8px; justify-content: flex-end;
    padding: 12px 24px; background: white;
    border-bottom: 1px solid var(--line);
  }
  .toolbar button {
    padding: 6px 14px; border-radius: 6px;
    background: var(--brand-navy); color: white; border: 0;
    font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .toolbar button.secondary {
    background: white; color: var(--ink); border: 1px solid var(--line);
  }
  .page {
    max-width: 1100px; margin: 16px auto; padding: 32px;
    background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  header {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 3px solid var(--brand-navy); padding-bottom: 14px; margin-bottom: 18px;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { height: 44px; width: auto; }
  .brand-text strong {
    display: block; font-size: 17px; color: var(--brand-navy); letter-spacing: -0.01em;
  }
  .brand-text span { font-size: 11px; color: var(--muted); }
  .meta { text-align: right; }
  .meta h1 {
    margin: 0 0 4px 0; font-size: 17px; color: var(--brand-navy);
  }
  .meta .range { font-size: 13px; font-weight: 600; }
  .meta .gen { font-size: 10px; color: var(--muted); margin-top: 4px; }
  .summary {
    display: flex; gap: 16px; margin-bottom: 14px;
  }
  .summary .stat {
    flex: 1; border: 1px solid var(--line); border-radius: 6px;
    padding: 10px 12px; background: var(--soft);
  }
  .summary .stat .label {
    font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted);
  }
  .summary .stat .value {
    font-size: 16px; font-weight: 700; color: var(--brand-navy); margin-top: 2px;
  }
  table {
    width: 100%; border-collapse: collapse; font-size: 11px;
  }
  thead th {
    background: var(--brand-navy); color: white;
    padding: 8px 10px; text-align: left;
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  }
  thead th.num { text-align: right; }
  tbody td {
    padding: 6px 10px; border-bottom: 1px solid var(--line);
    vertical-align: top;
  }
  tbody td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  tbody td.nowrap { white-space: nowrap; }
  tbody td.mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; }
  tr.week-total td {
    background: #fef3c7; font-weight: 700;
    border-top: 1px solid #fde68a; border-bottom: 1px solid #fde68a;
  }
  .week-total-label { text-align: right; letter-spacing: 0.04em; }
  .grand {
    margin-top: 14px; padding: 12px 16px;
    background: var(--brand-navy); color: white;
    display: flex; align-items: center; justify-content: space-between;
    border-radius: 4px;
  }
  .grand .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; }
  .grand .value { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .empty {
    padding: 60px 20px; text-align: center; color: var(--muted);
    border: 2px dashed var(--line); border-radius: 8px;
  }
  footer {
    margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--line);
    font-size: 9px; color: var(--muted); text-align: center;
  }

  @media print {
    body { background: white; font-size: 10px; }
    .toolbar { display: none; }
    .page {
      max-width: none; margin: 0; padding: 0; box-shadow: none;
    }
    @page { size: letter landscape; margin: 0.4in; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    tr.week-total { break-inside: avoid; }
    .grand { break-before: avoid; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="secondary" onclick="window.close()">Close</button>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="page">
    <header>
      <div class="brand">
        <img src="/swlogorwb.png" alt="S&W" />
        <div class="brand-text">
          <strong>S&amp;W Foundation Contractors</strong>
          <span>Daily Job Detail Report</span>
        </div>
      </div>
      <div class="meta">
        <h1>Job Detail</h1>
        <div class="range">${escape(formatLongRange(from, to))}</div>
        <div class="gen">Generated ${escape(generatedAt)}</div>
      </div>
    </header>

    ${empty ? `<div class="empty">No jobs in this date range.</div>` : `
      <div class="summary">
        <div class="stat">
          <div class="label">Days</div>
          <div class="value">${dayCount}</div>
        </div>
        <div class="stat">
          <div class="label">Job Rows</div>
          <div class="value">${jobCount}</div>
        </div>
        <div class="stat">
          <div class="label">Total Revenue</div>
          <div class="value">${escape(formatMoney(grandRevenue))}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Job Name</th>
            <th>Job #</th>
            <th>Location</th>
            <th class="num">Revenue</th>
            <th>Notes / Status</th>
            <th>Crew / Rig</th>
          </tr>
        </thead>
        <tbody>${bodyRows.join("")}</tbody>
      </table>

      <div class="grand">
        <div class="label">Grand Total</div>
        <div class="value">${escape(formatMoney(grandRevenue))}</div>
      </div>
    `}

    <footer>
      S&amp;W Foundation Contractors · Generated ${escape(generatedAt)}<br/>
      <span style="font-style:italic;">Daily, weekly, and grand totals are taken from the source documents (the “Total: $X” line on each daily report). Per-row revenues are shown as parsed; if a day's per-row sum doesn't match its stated total, the discrepancy is flagged in the admin UI.</span>
    </footer>
  </div>
  ${autoprintScript}
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(html);
}
