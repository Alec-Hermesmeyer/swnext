import { createClient } from "@supabase/supabase-js";
import { getEmbedding } from "@/lib/embeddings";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // GET — list documents or search
  if (req.method === "GET") {
    const { q, category, source, limit: rawLimit } = req.query;
    const docLimit = Math.min(parseInt(rawLimit) || 50, 200);

    // If q is provided, do similarity search
    if (q) {
      try {
        const embedding = await getEmbedding(q);
        const { data, error } = await supabase.rpc("match_documents", {
          query_embedding: embedding,
          match_threshold: 0.65,
          match_count: docLimit,
        });

        if (error) {
          console.error("RAG search error:", error);
          return res.status(500).json({ error: "Search failed" });
        }

        return res.status(200).json({ results: data || [], query: q });
      } catch (err) {
        console.error("RAG search error:", err);
        return res.status(500).json({ error: err.message });
      }
    }

    // Otherwise list documents
    let query = supabase
      .from("documents")
      .select("id, content, metadata, source, category, created_at")
      .order("created_at", { ascending: false })
      .limit(docLimit);

    if (category) query = query.eq("category", category);
    if (source) query = query.eq("source", source);

    const { data, error } = await query;
    if (error) {
      console.error("RAG list error:", error);
      return res.status(500).json({ error: "Failed to list documents" });
    }

    return res.status(200).json({ documents: data || [] });
  }

  // POST — add document(s) to the knowledge base
  if (req.method === "POST") {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY not configured — needed to generate embeddings" });
    }

    const { documents: docs, content, category, source, metadata } = req.body || {};

    // Single document
    if (content) {
      try {
        const embedding = await getEmbedding(content);
        const { data, error } = await supabase
          .from("documents")
          .insert({
            content,
            category: category || "general",
            source: source || "manual",
            metadata: metadata || {},
            embedding,
          })
          .select("id, content, category, source, created_at")
          .single();

        if (error) {
          console.error("RAG insert error:", error);
          return res.status(500).json({ error: "Failed to store document" });
        }

        return res.status(200).json({ document: data, embedded: true });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    // Batch documents
    if (Array.isArray(docs) && docs.length) {
      const results = { stored: 0, failed: 0, errors: [] };

      // Process in batches of 10 to avoid rate limits
      for (let i = 0; i < docs.length; i += 10) {
        const batch = docs.slice(i, i + 10);
        const rows = [];

        for (const doc of batch) {
          try {
            const embedding = await getEmbedding(doc.content);
            rows.push({
              content: doc.content,
              category: doc.category || category || "general",
              source: doc.source || source || "backfill",
              metadata: doc.metadata || {},
              embedding,
            });
          } catch (err) {
            results.failed++;
            results.errors.push(err.message);
          }
        }

        if (rows.length) {
          const { error } = await supabase.from("documents").insert(rows);
          if (error) {
            results.failed += rows.length;
            results.errors.push(error.message);
          } else {
            results.stored += rows.length;
          }
        }
      }

      return res.status(200).json(results);
    }

    return res.status(400).json({ error: "Provide content (single) or documents (batch)" });
  }

  // DELETE — remove a document
  if (req.method === "DELETE") {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id is required" });

    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return res.status(500).json({ error: "Failed to delete" });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
  api: { bodyParser: { sizeLimit: "4mb" } },
};
