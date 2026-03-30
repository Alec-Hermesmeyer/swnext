import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Pull all chat messages that contain a workflow profile
    const { data: rows, error } = await supabase
      .from("chat_messages")
      .select("metadata, created_at")
      .not("metadata->>assistantProfile", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Team insights query error:", error);
      return res.status(500).json({ error: "Failed to fetch team insights" });
    }

    // Group by user — keep only the latest profile per person
    const byUser = {};
    (rows || []).forEach((row) => {
      const profile = row.metadata?.assistantProfile;
      if (!profile) return;

      const userId = row.metadata?.user_id;
      if (!userId) return;

      // Only keep the most recent (query is desc by created_at)
      if (!byUser[userId]) {
        byUser[userId] = {
          user_id: userId,
          user_name: profile.userNameSnapshot || "Unknown",
          role: profile.roleSnapshot || row.metadata?.role || "",
          department: profile.departmentSnapshot || row.metadata?.department || "",
          role_title: profile.role_title || "",
          department_name: profile.department_name || "",
          primary_goals: profile.primary_goals || "",
          repetitive_tasks: profile.repetitive_tasks || "",
          current_tools: profile.current_tools || "",
          biggest_blockers: profile.biggest_blockers || "",
          automation_comfort: profile.automation_comfort || "",
          saved_at: profile.savedAt || row.created_at,
        };
      }
    });

    const profiles = Object.values(byUser).sort((a, b) =>
      (a.user_name || "").localeCompare(b.user_name || "")
    );

    // Build a summary for chatbot consumption
    const summary = profiles.map((p) => {
      const lines = [`**${p.user_name}** (${p.role_title || p.role || "no title"})`];
      if (p.primary_goals) lines.push(`  Goals: ${p.primary_goals}`);
      if (p.repetitive_tasks) lines.push(`  Repetitive tasks: ${p.repetitive_tasks}`);
      if (p.biggest_blockers) lines.push(`  Blockers: ${p.biggest_blockers}`);
      if (p.current_tools) lines.push(`  Current tools: ${p.current_tools}`);
      if (p.automation_comfort) lines.push(`  Automation comfort: ${p.automation_comfort}`);
      return lines.join("\n");
    }).join("\n\n");

    return res.status(200).json({
      profiles,
      count: profiles.length,
      summary,
    });
  } catch (err) {
    console.error("Team insights error:", err);
    return res.status(500).json({ error: "Failed to fetch team insights" });
  }
}
