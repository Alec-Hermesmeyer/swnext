import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Resolve auth.users id from the same session cookies / Bearer token as /api/ai-chat.
 * Injected into POST /chat so the Flask backend does not rely on env fallbacks for logged-in users.
 */
async function getSupabaseUserIdFromRequest(req) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const accessToken =
    req.cookies?.["sb-access-token"] ||
    (typeof req.headers?.authorization === "string"
      ? req.headers.authorization.replace(/^Bearer\s+/i, "")
      : "");
  if (!accessToken) return null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);
  if (error || !user?.id) return null;
  return user.id;
}

// Proxy API requests to Flask backend to avoid CORS issues
export default async function handler(req, res) {
  const FLASK_BACKEND = process.env.FLASK_BACKEND || 'http://localhost:5000';
  const SOCIAL_WORKSPACE_TOKEN = process.env.SOCIAL_WORKSPACE_TOKEN || '';

  // Get the path from the catch-all route
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = `${FLASK_BACKEND}/${targetPath}`;

  // Build query string if present (exclude the 'path' param we added)
  const url = new URL(req.url, 'http://localhost');
  url.searchParams.delete('path');
  const queryString = url.searchParams.toString() ? `?${url.searchParams.toString()}` : '';

  const fullUrl = `${targetUrl}${queryString}`;

  console.log(`[Proxy] ${req.method} ${fullUrl}`);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Forward workspace auth token to Flask backend
    if (SOCIAL_WORKSPACE_TOKEN) {
      headers['Authorization'] = `Bearer ${SOCIAL_WORKSPACE_TOKEN}`;
    }

    // Also forward any Authorization header from the client
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    // Forward body for POST/PUT/PATCH (always stringify objects so Flask receives JSON)
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body != null) {
      let payload = req.body;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          payload = req.body;
        }
      }
      if (
        req.method === "POST" &&
        targetPath === "chat" &&
        payload &&
        typeof payload === "object" &&
        !Array.isArray(payload)
      ) {
        const userId = await getSupabaseUserIdFromRequest(req);
        if (userId) {
          payload = { ...payload, user_id: userId };
        }
      }
      fetchOptions.body =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Proxy] Body (user_id injected server-side when session present):`, payload);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    fetchOptions.signal = controller.signal;

    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeout);

    // Get response data
    const contentType = response.headers.get('content-type');
    let data;
    try {
      if (contentType?.includes('application/json')) {
        const raw = await response.text();
        data = raw ? JSON.parse(raw) : {};
      } else {
        data = await response.text();
      }
    } catch (parseErr) {
      console.error("[Proxy] Failed to parse backend response:", parseErr.message);
      return res.status(502).json({
        error: "Backend returned an unreadable response",
        message: parseErr.message,
        target: fullUrl,
      });
    }

    // Log non-200 responses for debugging
    if (!response.ok) {
      console.log(`[Proxy] Flask returned ${response.status}:`, data);
    }

    // Forward status and response
    res.status(response.status);

    if (typeof data === "object" && data !== null) {
      res.json(data);
    } else {
      res.send(data);
    }
  } catch (error) {
    console.error('[Proxy] Connection error:', error.message);
    const status = error.name === 'AbortError' ? 504 : 502;
    res.status(status).json({
      error: status === 504 ? 'Backend request timed out' : 'Failed to connect to backend',
      message: error.message,
      target: fullUrl
    });
  }
}

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
