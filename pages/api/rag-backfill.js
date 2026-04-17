import { createClient } from "@supabase/supabase-js";
import { getEmbedding, getEmbeddingBatch } from "@/lib/embeddings";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function embedAndStore(docs) {
  let stored = 0;
  let failed = 0;
  const errors = [];
  for (let i = 0; i < docs.length; i += 5) {
    const batch = docs.slice(i, i + 5);
    const rows = [];
    for (const doc of batch) {
      try {
        const embedding = await getEmbedding(doc.content);
        rows.push({ ...doc, embedding });
      } catch (err) {
        failed++;
        errors.push(`Embed: ${err.message}`);
      }
    }
    if (rows.length) {
      const { error } = await supabase.from("documents").insert(rows);
      if (error) {
        failed += rows.length;
        errors.push(`Insert: ${error.message}`);
      } else {
        stored += rows.length;
      }
    }
  }
  return { stored, failed, errors: errors.slice(0, 5) };
}

/** Port of bidding API chunking: split long proposal text for embeddings. */
function chunkBidText(text, maxChunkSize = 1400, overlap = 220) {
  const source = String(text || "").trim();
  if (!source) return [];
  const chunks = [];
  let start = 0;
  const length = source.length;
  while (start < length) {
    let end = Math.min(length, start + maxChunkSize);
    if (end < length) {
      const window = source.slice(start, Math.min(length, end + 220));
      const candidates = [
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf("\n"),
        window.lastIndexOf(" "),
      ];
      for (const bp of candidates) {
        if (bp > maxChunkSize / 2) {
          end = start + bp + 1;
          break;
        }
      }
    }
    const chunk = source.slice(start, end).trim();
    if (chunk.length >= 60) chunks.push(chunk);
    if (end >= length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks.slice(0, 80);
}

/**
 * One bid_documents row → many `documents` rows (structured fields + raw_text chunks).
 * Aligns with category "bidding" so sales chat (search_knowledge_base) can retrieve it.
 */
function rowsFromBidDocumentRow(doc) {
  const extracted = doc.extracted_json || {};
  const summary = extracted.summary || {};
  const filename = doc.filename || "unknown";
  const sourceLabel = doc.source_label || "upload";
  const opportunity = doc.sales_opportunities;
  const oppLine =
    opportunity && [opportunity.title, opportunity.company].filter(Boolean).join(" — ");
  const headerParts = [
    `Bid document: ${filename}`,
    `Uploaded via: ${sourceLabel}`,
    oppLine ? `Opportunity: ${oppLine}` : null,
  ];
  const header = headerParts.filter(Boolean).join("\n");

  const sections = [];

  if (summary && Object.keys(summary).length) {
    sections.push({
      section: "summary",
      text: JSON.stringify(summary),
    });
  }

  for (const key of ["scope_items", "assumptions", "exclusions", "risk_flags"]) {
    const values = extracted[key];
    if (Array.isArray(values) && values.length) {
      const lines = values.map((v) => `- ${String(v).trim()}`).filter((l) => l.length > 2);
      if (lines.length) {
        sections.push({ section: key, text: lines.join("\n") });
      }
    }
  }

  const priced = extracted.priced_items;
  if (Array.isArray(priced) && priced.length) {
    const lines = priced.slice(0, 40).map((item) => {
      const amount = item.amount || "";
      const cat = item.category || "other";
      const ctx = item.context || "";
      return `${amount} | ${cat} | ${ctx}`;
    });
    sections.push({ section: "priced_items", text: lines.join("\n") });
  }

  const raw = doc.raw_text || "";
  for (const chunk of chunkBidText(raw, 1300, 180)) {
    sections.push({ section: "raw_text", text: chunk });
    if (sections.length >= 30) break;
  }

  const rows = [];
  let chunkIndex = 0;
  for (const s of sections) {
    const body = String(s.text || "").trim();
    if (body.length < 40) continue;
    const content = `${header}\n\n---\n\n${body}`;
    rows.push({
      content,
      category: "bidding",
      source: "bid_documents",
      metadata: {
        bid_document_id: doc.id,
        filename,
        section: s.section,
        chunk_index: chunkIndex,
        opportunity_id: doc.opportunity_id || null,
      },
    });
    chunkIndex += 1;
    if (rows.length >= 30) break;
  }

  return rows;
}

// Backfill builders — convert existing DB rows into RAG documents
const BACKFILL_SOURCES = {
  crew_jobs: async () => {
    const { data } = await supabase
      .from("crew_jobs")
      .select("id, job_name, job_number, customer_name, address, city, pm_name, crane_required, hiring_contractor, is_active, scope_description, bid_amount, contract_amount, estimated_days, mob_days, pier_count, start_date, end_date, job_status");
    return (data || []).map((j) => {
      // Build prose-style content — embedding models retrieve better when
      // input reads like natural text rather than flat key/value pairs.
      const lines = [
        `Crew job: ${j.job_name}${j.job_number ? ` (Job #${j.job_number})` : ""}.`,
      ];
      if (j.customer_name) lines.push(`Customer: ${j.customer_name}.`);
      if (j.hiring_contractor) lines.push(`Hired by: ${j.hiring_contractor}.`);
      if (j.address || j.city) {
        lines.push(`Location: ${[j.address, j.city].filter(Boolean).join(", ")}.`);
      }
      if (j.pm_name) lines.push(`Project manager: ${j.pm_name}.`);
      if (j.scope_description) lines.push(`Scope: ${j.scope_description}.`);
      if (j.pier_count) lines.push(`Pier count: ${j.pier_count}.`);
      if (j.crane_required) lines.push("Crane required.");
      if (j.bid_amount) lines.push(`Bid amount: $${Number(j.bid_amount).toLocaleString()}.`);
      if (j.contract_amount) lines.push(`Contract amount: $${Number(j.contract_amount).toLocaleString()}.`);
      if (j.estimated_days) lines.push(`Estimated duration: ${j.estimated_days} working days${j.mob_days ? ` + ${j.mob_days} mob days` : ""}.`);
      if (j.start_date) lines.push(`Start: ${j.start_date}${j.end_date ? `, End: ${j.end_date}` : ""}.`);
      const status = j.job_status || (j.is_active === false ? "inactive" : "active");
      lines.push(`Status: ${status}.`);

      return {
        content: lines.join(" "),
        category: "project_history",
        source: "crew_jobs",
        metadata: {
          job_id: j.id,
          job_name: j.job_name,
          customer: j.customer_name || null,
          status,
        },
      };
    });
  },

  contact_submissions: async () => {
    const { data } = await supabase
      .from("contact_form")
      .select("id, name, email, number, message, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data || []).filter((s) => s.message).map((s) => ({
      content: `Contact form submission from ${s.name || "Unknown"} (${s.email || "no email"}, ${s.number || "no phone"}): "${s.message}". Submitted ${s.created_at ? new Date(s.created_at).toLocaleDateString() : "recently"}.`,
      category: "client_inquiry",
      source: "contact_submissions",
      metadata: { contact_id: s.id, name: s.name },
    }));
  },

  job_applications: async () => {
    const { data } = await supabase
      .from("job_form")
      .select("id, firstName, name, email, number, phone, position, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data || []).map((s) => ({
      content: `Job application from ${s.firstName || s.name || "Unknown"} for ${s.position || "unspecified position"}. Email: ${s.email || "none"}, Phone: ${s.number || s.phone || "none"}. Applied ${s.created_at ? new Date(s.created_at).toLocaleDateString() : "recently"}.`,
      category: "hiring",
      source: "job_applications",
      metadata: { app_id: s.id, name: s.firstName || s.name, position: s.position },
    }));
  },

  company_contacts: async () => {
    const { data } = await supabase.from("company_contacts").select("*");
    return (data || []).map((c) => ({
      content: `Company contact: ${c.name}${c.job_title ? `, ${c.job_title}` : ""}. ${c.email ? `Email: ${c.email}` : ""}${c.phone ? ` Phone: ${c.phone}` : ""}.`,
      category: "company_info",
      source: "company_contacts",
      metadata: { contact_id: c.id, name: c.name },
    }));
  },

  career_positions: async () => {
    const { data } = await supabase.from("jobs").select("*");
    return (data || []).map((j) => ({
      content: `Career position: ${j.jobTitle}. ${j.is_Open ? "Currently OPEN" : "Currently CLOSED"}. ${j.jobDesc ? `Description: ${j.jobDesc.substring(0, 500)}` : ""}`,
      category: "hiring",
      source: "career_positions",
      metadata: { position_id: j.id, title: j.jobTitle, open: j.is_Open },
    }));
  },

  workflow_profiles: async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("metadata, created_at")
      .not("metadata->>assistantProfile", "is", null)
      .order("created_at", { ascending: false });

    const byUser = {};
    (data || []).forEach((row) => {
      const profile = row.metadata?.assistantProfile;
      const userId = row.metadata?.user_id;
      if (!profile || !userId || byUser[userId]) return;
      byUser[userId] = profile;
    });

    return Object.values(byUser).map((p) => ({
      content: [
        `Team member workflow profile: ${p.userNameSnapshot || "Unknown"}`,
        p.role_title ? `Role: ${p.role_title}` : null,
        p.department_name ? `Department: ${p.department_name}` : null,
        p.primary_goals ? `Goals: ${p.primary_goals}` : null,
        p.repetitive_tasks ? `Repetitive tasks: ${p.repetitive_tasks}` : null,
        p.biggest_blockers ? `Blockers: ${p.biggest_blockers}` : null,
        p.current_tools ? `Current tools: ${p.current_tools}` : null,
        p.automation_comfort ? `Automation comfort: ${p.automation_comfort}` : null,
      ].filter(Boolean).join(". "),
      category: "team_insights",
      source: "workflow_profiles",
      metadata: { user_name: p.userNameSnapshot },
    }));
  },

  /** Sales bid uploads (`bid_documents`) → RAG for admin/sales chat via search_knowledge_base */
  bid_documents: async () => {
    const { data: docs, error } = await supabase
      .from("bid_documents")
      .select("id, filename, source_label, raw_text, extracted_json, opportunity_id, created_at");
    if (error) throw error;

    const oppIds = [...new Set((docs || []).map((d) => d.opportunity_id).filter(Boolean))];
    const oppById = {};
    if (oppIds.length) {
      const { data: opps, error: oppErr } = await supabase
        .from("sales_opportunities")
        .select("id, title, company")
        .in("id", oppIds);
      if (oppErr) throw oppErr;
      (opps || []).forEach((o) => {
        oppById[o.id] = o;
      });
    }

    const out = [];
    for (const doc of docs || []) {
      const hasText = doc.raw_text && String(doc.raw_text).trim().length >= 40;
      const ex = doc.extracted_json || {};
      const hasExtracted =
        (ex.summary && Object.keys(ex.summary).length > 0) ||
        ["scope_items", "assumptions", "exclusions", "priced_items", "risk_flags"].some(
          (k) => Array.isArray(ex[k]) && ex[k].length
        );
      if (!hasText && !hasExtracted) continue;
      const enriched = {
        ...doc,
        sales_opportunities: doc.opportunity_id ? oppById[doc.opportunity_id] : null,
      };
      out.push(...rowsFromBidDocumentRow(enriched));
    }
    return out;
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  }

  const { source } = req.body || {};

  // List available sources
  if (source === "list") {
    // Check what's already backfilled
    const { data: existing } = await supabase
      .from("documents")
      .select("source")
      .limit(500);
    const sourceCounts = {};
    (existing || []).forEach((d) => {
      sourceCounts[d.source] = (sourceCounts[d.source] || 0) + 1;
    });

    const sources = Object.keys(BACKFILL_SOURCES).map((key) => ({
      key,
      existing:
        key === "bid_documents"
          ? (sourceCounts.bid_documents || 0) + (sourceCounts["bidding-upload"] || 0)
          : sourceCounts[key] || 0,
    }));

    return res.status(200).json({ sources });
  }

  if (!source || !BACKFILL_SOURCES[source]) {
    return res.status(400).json({
      error: `Invalid source. Available: ${Object.keys(BACKFILL_SOURCES).join(", ")}`,
    });
  }

  try {
    // Clear old documents from this source before re-backfilling
    if (source === "bid_documents") {
      await supabase.from("documents").delete().in("source", ["bid_documents", "bidding-upload"]);
    } else {
      await supabase.from("documents").delete().eq("source", source);
    }

    const docs = await BACKFILL_SOURCES[source]();
    if (!docs.length) {
      return res.status(200).json({ stored: 0, failed: 0, message: `No data found for ${source}` });
    }

    const result = await embedAndStore(docs);
    return res.status(200).json({ ...result, total: docs.length, source });
  } catch (err) {
    console.error("Backfill error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: "4mb" } },
};
