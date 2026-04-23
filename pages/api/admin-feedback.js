/**
 * /api/admin-feedback — CRUD for the admin feedback system.
 *
 * GET     → list all feedback (supports ?type=, ?page=, ?resolved= filters)
 * POST    → submit new feedback  { page, type, feedback_text }
 * PATCH   → toggle resolved      { id, is_resolved }
 * DELETE  → remove feedback       ?id=<feedback_id>
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default async function handler(req, res) {
  // ── GET — list feedback with optional filters ─────────────────
  if (req.method === "GET") {
    try {
      let query = supabase
        .from("admin_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      const { type, page, resolved } = req.query;
      if (type) query = query.eq("type", type);
      if (page) query = query.ilike("page", `%${page}%`);
      if (resolved === "true") query = query.eq("is_resolved", true);
      if (resolved === "false") query = query.eq("is_resolved", false);

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return res.status(200).json({ feedback: data || [] });
    } catch (err) {
      if (err?.code === "42P01" || err?.message?.includes("does not exist")) {
        return res.status(200).json({ feedback: [], _note: "admin_feedback table not created yet" });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — submit new feedback ────────────────────────────────
  if (req.method === "POST") {
    const { page: feedbackPage, type, feedback_text, user_id, user_name, user_email, user_role } = req.body || {};

    if (!feedbackPage || !type || !feedback_text?.trim()) {
      return res.status(400).json({ error: "page, type, and feedback_text are required" });
    }
    if (!["positive", "negative", "suggestion"].includes(type)) {
      return res.status(400).json({ error: "type must be positive, negative, or suggestion" });
    }

    try {
      const { data, error } = await supabase
        .from("admin_feedback")
        .insert({
          page: feedbackPage,
          type,
          feedback_text: feedback_text.trim(),
          user_id: user_id || null,
          user_name: user_name || null,
          user_email: user_email || null,
          user_role: user_role || null,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ feedback: data });
    } catch (err) {
      if (err?.code === "42P01" || err?.message?.includes("does not exist")) {
        return res.status(503).json({ error: "admin_feedback table not created yet. Run scripts/admin_feedback.sql first." });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PATCH — toggle resolved status ────────────────────────────
  if (req.method === "PATCH") {
    const { id, is_resolved, resolved_by } = req.body || {};
    if (!id) return res.status(400).json({ error: "id is required" });

    try {
      const update = { is_resolved: Boolean(is_resolved) };
      if (is_resolved) {
        update.resolved_at = new Date().toISOString();
        update.resolved_by = resolved_by || null;
      } else {
        update.resolved_at = null;
        update.resolved_by = null;
      }

      const { data, error } = await supabase
        .from("admin_feedback")
        .update(update)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ feedback: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE — remove feedback ──────────────────────────────────
  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id query param required" });

    try {
      const { error } = await supabase.from("admin_feedback").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
