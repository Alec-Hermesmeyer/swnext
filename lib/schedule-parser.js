/**
 * Schedule Photo Parser — Fuzzy matching engine
 *
 * Maps raw OCR-extracted names to known Supabase entities using Fuse.js.
 * Returns confidence-tiered results for each match attempt.
 */
import Fuse from "fuse.js";

// ---------------------------------------------------------------------------
// Confidence tiers
// ---------------------------------------------------------------------------
export const CONFIDENCE = {
  HIGH: "high",     // score > 0.85 — auto-match
  MEDIUM: "medium", // score 0.50–0.85 — user confirms
  LOW: "low",       // score < 0.50 — manual selection
  NEW: "new",       // no candidates at all
};

const scoreToConfidence = (fuseScore) => {
  // Fuse returns 0 = perfect, 1 = worst.  We invert so 1 = perfect.
  const confidence = 1 - (fuseScore ?? 1);
  if (confidence >= 0.85) return CONFIDENCE.HIGH;
  if (confidence >= 0.50) return CONFIDENCE.MEDIUM;
  return CONFIDENCE.LOW;
};

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------
const norm = (v) => String(v || "").trim().toLowerCase();

const normTruck = (v) => {
  const s = norm(v);
  // Normalize "T-13", "T13", "t-13", "#T-13" all to "t-13"
  return s.replace(/^[#]?\s*/, "").replace(/^(t)\s*[-]?\s*(\d+)$/i, "t-$2");
};

// ---------------------------------------------------------------------------
// Build Fuse instances for each entity type
// ---------------------------------------------------------------------------
const FUSE_DEFAULTS = { includeScore: true, threshold: 0.45 };

export function buildMatchers(entities) {
  const { workers = [], jobs = [], categories = [], trucks = [], superintendents = [] } = entities;

  return {
    workers: new Fuse(workers, {
      ...FUSE_DEFAULTS,
      keys: ["name"],
      threshold: 0.40,
    }),
    jobs: new Fuse(jobs, {
      ...FUSE_DEFAULTS,
      keys: [
        { name: "job_name", weight: 0.6 },
        { name: "job_number", weight: 0.4 },
      ],
      threshold: 0.35,
    }),
    categories: new Fuse(categories, {
      ...FUSE_DEFAULTS,
      keys: ["name"],
      threshold: 0.40,
    }),
    trucks: new Fuse(trucks, {
      ...FUSE_DEFAULTS,
      keys: ["truck_number"],
      threshold: 0.25, // truck numbers are short, need tight match
    }),
    superintendents: new Fuse(superintendents, {
      ...FUSE_DEFAULTS,
      keys: ["name"],
      threshold: 0.40,
    }),
    // Keep raw lists for exact-match fast paths
    _raw: { workers, jobs, categories, trucks, superintendents },
  };
}

// ---------------------------------------------------------------------------
// Match a single value against a Fuse instance
// ---------------------------------------------------------------------------
function fuseMatch(fuse, query, topN = 3) {
  if (!query || !norm(query)) {
    return { match: null, candidates: [], confidence: CONFIDENCE.NEW };
  }
  const results = fuse.search(norm(query)).slice(0, topN);
  if (results.length === 0) {
    return { match: null, candidates: [], confidence: CONFIDENCE.NEW };
  }
  const best = results[0];
  return {
    match: best.item,
    score: 1 - (best.score ?? 1),
    confidence: scoreToConfidence(best.score),
    candidates: results.map((r) => ({
      item: r.item,
      score: 1 - (r.score ?? 1),
      confidence: scoreToConfidence(r.score),
    })),
  };
}

// ---------------------------------------------------------------------------
// Exact-match fast paths (for things like truck numbers, job numbers)
// ---------------------------------------------------------------------------
function exactTruckMatch(trucks, raw) {
  const needle = normTruck(raw);
  if (!needle) return null;
  const found = trucks.find((t) => normTruck(t.truck_number) === needle);
  return found || null;
}

function exactJobNumberMatch(jobs, raw) {
  const needle = norm(raw).replace(/[^0-9]/g, "");
  if (!needle || needle.length < 3) return null;
  return jobs.find((j) => {
    const jn = norm(j.job_number).replace(/[^0-9]/g, "");
    return jn === needle || jn.endsWith(needle);
  }) || null;
}

// ---------------------------------------------------------------------------
// Day-type classification from status text
// ---------------------------------------------------------------------------
const STATUS_MAP = [
  { pattern: /mob/i, type: "mob", label: "Mob Rig" },
  { pattern: /down\s*day/i, type: "down_day", label: "Down Day" },
  { pattern: /repair/i, type: "repairs", label: "Repairs" },
  { pattern: /shop|yard/i, type: "shop", label: "Shop / Yard" },
];

export function classifyDayStatus(rawStatus) {
  if (!rawStatus || norm(rawStatus) === "working") {
    return { type: "working", label: "" };
  }
  for (const { pattern, type, label } of STATUS_MAP) {
    if (pattern.test(rawStatus)) return { type, label };
  }
  return { type: "custom", label: rawStatus.trim() };
}

// ---------------------------------------------------------------------------
// Match a single extracted row against all entity types
// ---------------------------------------------------------------------------
export function matchRow(row, matchers) {
  const { _raw } = matchers;

  // --- Job match: try exact job number first, then fuzzy name ---
  let jobResult;
  const exactJob = row.job_number ? exactJobNumberMatch(_raw.jobs, row.job_number) : null;
  if (exactJob) {
    jobResult = {
      match: exactJob,
      score: 1.0,
      confidence: CONFIDENCE.HIGH,
      candidates: [{ item: exactJob, score: 1.0, confidence: CONFIDENCE.HIGH }],
    };
  } else if (row.job_name) {
    jobResult = fuseMatch(matchers.jobs, row.job_name);
  } else {
    jobResult = { match: null, candidates: [], confidence: CONFIDENCE.NEW };
  }

  // --- Truck match: exact normalization first, then fuzzy ---
  let truckResult;
  const exactTruck = row.truck_number ? exactTruckMatch(_raw.trucks, row.truck_number) : null;
  if (exactTruck) {
    truckResult = {
      match: exactTruck,
      score: 1.0,
      confidence: CONFIDENCE.HIGH,
      candidates: [{ item: exactTruck, score: 1.0, confidence: CONFIDENCE.HIGH }],
    };
  } else if (row.truck_number) {
    truckResult = fuseMatch(matchers.trucks, row.truck_number);
  } else {
    truckResult = { match: null, candidates: [], confidence: CONFIDENCE.NEW };
  }

  // --- Superintendent match ---
  const superResult = row.superintendent
    ? fuseMatch(matchers.superintendents, row.superintendent)
    : { match: null, candidates: [], confidence: CONFIDENCE.NEW };

  // --- Category (rig) match ---
  const catResult = row.rig_name
    ? fuseMatch(matchers.categories, row.rig_name)
    : { match: null, candidates: [], confidence: CONFIDENCE.NEW };

  // --- Crew member matches ---
  const crewResults = (row.crew_members || []).map((name) => ({
    raw: name,
    ...fuseMatch(matchers.workers, name),
  }));

  // --- Day status ---
  const dayStatus = classifyDayStatus(row.status_text || row.status);

  return {
    row_number: row.row_number,
    raw: row,
    job: jobResult,
    truck: truckResult,
    superintendent: superResult,
    category: catResult,
    crew: crewResults,
    dayStatus,
    start_time: row.start_time || null,
    crane_info: row.crane_info || null,
    notes: row.notes || null,
    highlight_color: row.highlight_color || null,
  };
}

// ---------------------------------------------------------------------------
// Match all rows from Claude Vision output
// ---------------------------------------------------------------------------
export function matchAllRows(visionOutput, matchers) {
  const rows = visionOutput?.rows || [];
  return {
    schedule_date: visionOutput?.schedule_date || null,
    superintendent_header: visionOutput?.superintendent_header || null,
    matched_rows: rows.map((row) => matchRow(row, matchers)),
    summary: {
      total_rows: rows.length,
      high_confidence: 0,
      medium_confidence: 0,
      low_confidence: 0,
      new_entities: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Compute summary stats from matched results
// ---------------------------------------------------------------------------
export function computeSummary(matchedResult) {
  let high = 0;
  let medium = 0;
  let low = 0;
  let newEnt = 0;

  for (const row of matchedResult.matched_rows) {
    const fields = [row.job, row.truck, row.superintendent, row.category];
    for (const f of fields) {
      if (!f) continue;
      if (f.confidence === CONFIDENCE.HIGH) high++;
      else if (f.confidence === CONFIDENCE.MEDIUM) medium++;
      else if (f.confidence === CONFIDENCE.LOW) low++;
      else if (f.confidence === CONFIDENCE.NEW) newEnt++;
    }
    for (const c of row.crew) {
      if (c.confidence === CONFIDENCE.HIGH) high++;
      else if (c.confidence === CONFIDENCE.MEDIUM) medium++;
      else if (c.confidence === CONFIDENCE.LOW) low++;
      else if (c.confidence === CONFIDENCE.NEW) newEnt++;
    }
  }

  matchedResult.summary = {
    total_rows: matchedResult.matched_rows.length,
    high_confidence: high,
    medium_confidence: medium,
    low_confidence: low,
    new_entities: newEnt,
  };

  return matchedResult;
}
