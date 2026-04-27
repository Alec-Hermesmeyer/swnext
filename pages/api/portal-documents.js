/**
 * /api/portal-documents — Manage documents shared through client portals.
 *
 * Documents are stored in the `portal_documents` table and referenced by
 * portal_id + optional job_id.  Sources include bid-assistant drafts,
 * uploaded files, or field-report exports.
 *
 * GET    ?portal_id=<id>                → list docs for a portal
 * POST   { portal_id, title, ... }      → add a document reference
 * DELETE  ?id=<doc_id>                  → remove a document
 *
 * Requires auth (admin / operations / sales).
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default async function handler(req, res) {
  // ── GET — list documents for a portal ─────────────────────────
  if (req.method === "GET") {
    const { portal_id } = req.query;
    if (!portal_id) return res.status(400).json({ error: "portal_id required" });

    try {
      const { data, error } = await supabase
        .from("portal_documents")
        .select("*")
        .eq("portal_id", portal_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ documents: data || [] });
    } catch (err) {
      // Table may not exist yet
      if (err?.code === "42P01" || err?.message?.includes("does not exist")) {
        return res.status(200).json({ documents: [], _note: "portal_documents table not created yet" });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — add a document ─────────────────────────────────────
  if (req.method === "POST") {
    const { portal_id, job_id, title, description, file_url, file_type, document_source, bid_document_id } = req.body || {};
    if (!portal_id || !title) {
      return res.status(400).json({ error: "portal_id and title are required" });
    }

    try {
      const { data, error } = await supabase
        .from("portal_documents")
        .insert({
          portal_id,
          job_id: job_id || null,
          title: title.trim(),
          description: (description || "").trim() || null,
          file_url: file_url || null,
          file_type: file_type || "other",
          document_source: document_source || "upload",
          bid_document_id: bid_document_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ document: data });
    } catch (err) {
      if (err?.code === "42P01" || err?.message?.includes("does not exist")) {
        return res.status(503).json({
          error: "portal_documents table has not been created yet. Run the migration first.",
          migration: MIGRATION_SQL,
        });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  // ── DELETE — remove a document ────────────────────────────────
  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id required" });

    try {
      const { error } = await supabase.from("portal_documents").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}

/**
 * SQL to create the portal_documents table.
 * Run this in your Supabase SQL editor if it doesn't exist yet.
 */
const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS portal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id UUID NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  job_id UUID REFERENCES crew_jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT DEFAULT 'other',
  document_source TEXT DEFAULT 'upload',
  bid_document_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portal_documents_portal ON portal_documents(portal_id);
`.trim();
