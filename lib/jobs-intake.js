/**
 * Shared CSV/TSV paste → job-row parser. Works with Excel/Google Sheets
 * copy-paste (tabs) or CSV pastes. Understands a dozen common header
 * aliases so the user can paste Tatum's spreadsheet without editing it.
 *
 * Extracted from pages/admin/crew-scheduler.jsx so /admin/jobs can reuse it.
 */

export const JOB_INTAKE_FIELD_ORDER = [
  "job_name",
  "job_number",
  "dig_tess_number",
  "customer_name",
  "hiring_contractor",
  "hiring_contact_name",
  "hiring_contact_phone",
  "hiring_contact_email",
  "address",
  "city",
  "zip",
  "pm_name",
  "pm_phone",
  "default_rig",
  "crane_required",
];

export const JOB_INTAKE_HEADER_ALIASES = {
  job_name: ["job name", "job", "project name", "project", "site name"],
  job_number: ["job number", "job #", "job no", "project number", "project #", "number"],
  dig_tess_number: ["dig tess", "dig tess #", "dig-tess", "dig_tess_number", "dig ticket"],
  customer_name: ["customer", "customer name", "owner"],
  hiring_contractor: ["hiring contractor", "contractor", "gc", "general contractor"],
  hiring_contact_name: ["contact", "contact name", "hiring contact", "hiring contact name"],
  hiring_contact_phone: ["contact phone", "phone", "hiring contact phone", "contact number"],
  hiring_contact_email: ["contact email", "email", "hiring contact email"],
  address: ["address", "job address", "site address", "street"],
  city: ["city", "town"],
  zip: ["zip", "zipcode", "postal", "postal code"],
  pm_name: ["pm", "pm name", "project manager", "project manager name"],
  pm_phone: ["pm phone", "project manager phone"],
  default_rig: ["default rig", "rig", "rig preference"],
  crane_required: ["crane", "crane required", "needs crane", "crane?"],
};

function splitCsvLine(line) {
  if (!line) return [];
  if (line.includes("\t") && !line.includes(",")) {
    return line.split("\t").map((s) => s.trim());
  }
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeaderLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getJobIntakeHeaderMap(columns) {
  const map = {};
  columns.forEach((column, idx) => {
    const normalized = normalizeHeaderLabel(column);
    if (!normalized) return;
    Object.entries(JOB_INTAKE_HEADER_ALIASES).forEach(([field, aliases]) => {
      if (map[field] !== undefined) return;
      if (aliases.includes(normalized)) {
        map[field] = idx;
      }
    });
  });
  return map;
}

function parseBooleanLike(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return false;
  return ["true", "yes", "y", "1", "required", "crane"].includes(normalized);
}

/**
 * Parse pasted text into an array of job draft rows.
 * @returns {{ rows: object[], error: string | null, hadHeader: boolean }}
 */
export function parseJobIntakeInput(raw) {
  const text = String(raw || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return { rows: [], error: "No jobs found. Paste at least one row.", hadHeader: false };
  }

  const firstColumns = splitCsvLine(lines[0]);
  const headerMap = getJobIntakeHeaderMap(firstColumns);
  const hasHeader =
    headerMap.job_name !== undefined || headerMap.job_number !== undefined;
  const rows = [];
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    if (!cols.length) continue;

    const draft = {};
    JOB_INTAKE_FIELD_ORDER.forEach((field, idx) => {
      if (hasHeader) {
        const headerIdx = headerMap[field];
        draft[field] = headerIdx === undefined ? "" : cols[headerIdx] || "";
      } else {
        draft[field] = cols[idx] || "";
      }
    });

    const jobNumber = String(draft.job_number || "").trim();
    const jobName =
      String(draft.job_name || "").trim() || (jobNumber ? `Job ${jobNumber}` : "");

    if (!jobName) continue;
    rows.push({
      job_name: jobName,
      job_number: jobNumber,
      dig_tess_number: String(draft.dig_tess_number || "").trim(),
      customer_name: String(draft.customer_name || "").trim(),
      hiring_contractor: String(draft.hiring_contractor || "").trim(),
      hiring_contact_name: String(draft.hiring_contact_name || "").trim(),
      hiring_contact_phone: String(draft.hiring_contact_phone || "").trim(),
      hiring_contact_email: String(draft.hiring_contact_email || "").trim(),
      address: String(draft.address || "").trim(),
      city: String(draft.city || "").trim(),
      zip: String(draft.zip || "").trim(),
      pm_name: String(draft.pm_name || "").trim(),
      pm_phone: String(draft.pm_phone || "").trim(),
      default_rig: String(draft.default_rig || "").trim(),
      crane_required: parseBooleanLike(draft.crane_required),
    });
  }

  if (!rows.length) {
    return {
      rows: [],
      error: "Could not parse any job rows. Include at least a job name column.",
      hadHeader: false,
    };
  }

  const deduped = new Map();
  rows.forEach((row) => {
    const key = row.job_number
      ? `num::${row.job_number.toLowerCase()}`
      : `name::${row.job_name.toLowerCase()}`;
    deduped.set(key, row);
  });

  return { rows: Array.from(deduped.values()), error: null, hadHeader: hasHeader };
}
