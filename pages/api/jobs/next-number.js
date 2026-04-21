/**
 * POST /api/jobs/next-number
 * Body: { name: string, year?: string }
 *   - name: customer or hiring-contractor string (required)
 *   - year: 2-digit year prefix. Defaults to current year (YY).
 *
 * Finds the reserved block for this name and returns the next unused
 * YY/NNNN inside it.
 *
 *  1. Exact case-insensitive match on job_number_blocks.block_owner
 *  2. Fallback: matching Misc {Letter} block based on first letter of name
 *  3. Query crew_jobs for the max job_number in the block's range
 *  4. Return next = max(block.start, last_used + 1), zero-padded
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const pad4 = (n) => String(n).padStart(4, "0");

const currentYearPrefix = () => {
  const y = new Date().getFullYear();
  return String(y).slice(-2);
};

function normalizeName(raw) {
  return String(raw || "").trim().toLowerCase();
}

async function findBlock(name, yearPrefix) {
  const { data, error } = await supabase
    .from("job_number_blocks")
    .select("*")
    .eq("year_prefix", yearPrefix);
  if (error) throw error;
  const blocks = data || [];

  const normalized = normalizeName(name);
  if (!normalized) return { block: null, matchType: "none" };

  // 1. Exact match on block_owner (case-insensitive)
  const exact = blocks.find((b) => normalizeName(b.block_owner) === normalized);
  if (exact) return { block: exact, matchType: "exact" };

  // 2. Partial match — block_owner is a substring of name or vice versa
  // (covers "Archer Western" vs "Archer Western Construction", etc.)
  const partial = blocks.find((b) => {
    const o = normalizeName(b.block_owner);
    if (!o || o.startsWith("misc")) return false;
    return normalized.includes(o) || o.includes(normalized);
  });
  if (partial) return { block: partial, matchType: "partial" };

  // 3. Misc fallback by first alpha character
  const firstChar = (normalized.match(/[a-z]/) || [null])[0];
  if (firstChar) {
    const miscLetter = firstChar.toUpperCase();
    const misc = blocks.find((b) => b.is_misc && b.misc_letter === miscLetter);
    if (misc) return { block: misc, matchType: "misc" };
  }

  return { block: null, matchType: "none" };
}

async function findNextNumberInBlock(block) {
  // Pull all crew_jobs whose job_number matches the block's year prefix and range.
  const prefix = `${block.year_prefix}/`;
  const { data, error } = await supabase
    .from("crew_jobs")
    .select("job_number")
    .ilike("job_number", `${prefix}%`);
  if (error) throw error;

  let maxSeq = block.start_num - 1;
  (data || []).forEach((row) => {
    const m = String(row.job_number || "").match(/^(\d{2})[\/\-](\d{4})$/);
    if (!m) return;
    if (m[1] !== block.year_prefix) return;
    const seq = parseInt(m[2], 10);
    if (seq >= block.start_num && seq <= block.end_num && seq > maxSeq) {
      maxSeq = seq;
    }
  });

  const nextSeq = maxSeq + 1;
  if (nextSeq > block.end_num) {
    return { next: null, nextSeq: null, full: true, usedCount: block.end_num - block.start_num + 1 };
  }
  return {
    next: `${block.year_prefix}/${pad4(nextSeq)}`,
    nextSeq,
    full: false,
    usedCount: Math.max(0, maxSeq - block.start_num + 1),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, year } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  const yearPrefix = (year || currentYearPrefix()).replace(/[^0-9]/g, "").slice(-2).padStart(2, "0");

  try {
    const { block, matchType } = await findBlock(name, yearPrefix);
    if (!block) {
      return res.status(200).json({
        next: null,
        match_type: "none",
        message: `No block found for "${name}" in year ${yearPrefix}. Add a block in Job Numbers admin or create one with this name to reserve a range.`,
      });
    }

    const { next, nextSeq, full, usedCount } = await findNextNumberInBlock(block);
    const totalCapacity = block.end_num - block.start_num + 1;

    return res.status(200).json({
      next,
      full,
      match_type: matchType,
      block: {
        owner: block.block_owner,
        range: `${block.year_prefix}/${pad4(block.start_num)} – ${block.year_prefix}/${pad4(block.end_num)}`,
        start_num: block.start_num,
        end_num: block.end_num,
        is_misc: block.is_misc,
      },
      used: usedCount,
      capacity: totalCapacity,
      remaining: Math.max(0, totalCapacity - usedCount - (next ? 1 : 0)),
    });
  } catch (err) {
    console.error("jobs/next-number error:", err);
    return res.status(500).json({ error: err?.message || "Lookup failed." });
  }
}
