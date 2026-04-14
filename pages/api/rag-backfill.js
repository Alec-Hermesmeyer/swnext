import { createClient } from "@supabase/supabase-js";
import { getEmbedding } from "@/lib/embeddings";

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

// Backfill builders — convert existing DB rows into RAG documents
const BACKFILL_SOURCES = {
  crew_jobs: async () => {
    const { data } = await supabase
      .from("crew_jobs")
      .select("id, job_name, job_number, customer_name, address, city, pm_name, crane_required, hiring_contractor, is_active");
    return (data || []).map((j) => ({
      content: [
        `Job: ${j.job_name}`,
        j.job_number ? `Job #${j.job_number}` : null,
        j.customer_name ? `Customer: ${j.customer_name}` : null,
        j.hiring_contractor ? `Hiring contractor: ${j.hiring_contractor}` : null,
        j.address || j.city ? `Location: ${[j.address, j.city].filter(Boolean).join(", ")}` : null,
        j.pm_name ? `PM: ${j.pm_name}` : null,
        j.crane_required ? "Crane required" : null,
        j.is_active === false ? "INACTIVE" : "Active",
      ].filter(Boolean).join(". "),
      category: "project_history",
      source: "crew_jobs",
      metadata: { job_id: j.id, job_name: j.job_name },
    }));
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
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!OPENAI_API_KEY) {
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
      existing: sourceCounts[key] || 0,
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
    await supabase.from("documents").delete().eq("source", source);

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
