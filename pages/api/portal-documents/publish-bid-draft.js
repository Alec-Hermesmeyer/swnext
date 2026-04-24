/**
 * POST /api/portal-documents/publish-bid-draft
 *
 * Export the saved bid draft as a DOCX from the bidding backend, upload it to
 * Supabase storage (bucket `portal-bid-exports`), and create a portal_documents
 * row pointing at the public URL. Snapshot semantics — re-publish to roll forward.
 *
 * Body: { portal_id, bid_document_id, title, description?, job_id? }
 * Auth: sb-access-token cookie (forwarded to the bidding backend as a Bearer).
 *
 * Bucket must be created once per environment:
 *   INSERT INTO storage.buckets (id, name, public)
 *   VALUES ('portal-bid-exports', 'portal-bid-exports', true);
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const BIDDING_BACKEND =
  process.env.BIDDING_BACKEND ||
  process.env.BIDDING_API_URL ||
  process.env.NEXT_PUBLIC_BIDDING_BACKEND ||
  process.env.NEXT_PUBLIC_BIDDING_API_URL ||
  "http://localhost:8000";

const BUCKET = process.env.PORTAL_BID_EXPORTS_BUCKET || "portal-bid-exports";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sanitizeForPath = (s) =>
  String(s || "draft")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "draft";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { portal_id, bid_document_id, job_id, title, description } = req.body || {};
  if (!portal_id || !bid_document_id || !title) {
    return res
      .status(400)
      .json({ error: "portal_id, bid_document_id, and title are required" });
  }

  const accessToken =
    req.cookies?.["sb-access-token"] ||
    req.headers?.authorization?.replace(/^Bearer\s+/i, "") ||
    "";
  if (!accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { data: portal, error: portalErr } = await supabase
      .from("client_portals")
      .select("id, label")
      .eq("id", portal_id)
      .maybeSingle();
    if (portalErr) throw portalErr;
    if (!portal) return res.status(404).json({ error: "Portal not found" });

    const exportUrl = `${BIDDING_BACKEND.replace(/\/$/, "")}/api/ai-bidding/documents/${bid_document_id}/draft/export`;
    const exportRes = await fetch(exportUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ format: "docx" }),
    });
    if (!exportRes.ok) {
      let detail = "";
      try {
        const parsed = await exportRes.json();
        detail = parsed?.detail || parsed?.error || "";
      } catch {
        detail = await exportRes.text().catch(() => "");
      }
      return res
        .status(502)
        .json({ error: detail || `Bidding backend returned ${exportRes.status}` });
    }
    const docxBuffer = Buffer.from(await exportRes.arrayBuffer());

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const storagePath = `${portal_id}/${sanitizeForPath(title)}-${timestamp}.docx`;
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, docxBuffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });
    if (uploadErr) {
      const missingBucket =
        uploadErr.message?.toLowerCase().includes("bucket") ||
        uploadErr.message?.toLowerCase().includes("not found");
      return res.status(500).json({
        error: uploadErr.message,
        setup: missingBucket
          ? `Create the "${BUCKET}" bucket in Supabase storage with public-read access.`
          : undefined,
      });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const file_url = urlData?.publicUrl || null;

    const { data: docRow, error: insertErr } = await supabase
      .from("portal_documents")
      .insert({
        portal_id,
        job_id: job_id || null,
        title: title.trim(),
        description: (description || "").trim() || null,
        file_url,
        file_type: "docx",
        document_source: "bid_draft",
        bid_document_id,
      })
      .select()
      .single();
    if (insertErr) {
      if (insertErr.code === "42P01" || insertErr.message?.includes("does not exist")) {
        return res.status(503).json({
          error:
            "portal_documents table has not been created yet. Run the migration first.",
        });
      }
      throw insertErr;
    }

    return res
      .status(201)
      .json({ document: docRow, portal: { id: portal.id, label: portal.label } });
  } catch (err) {
    console.error("publish-bid-draft error:", err);
    return res.status(500).json({ error: err?.message || "Could not publish" });
  }
}
