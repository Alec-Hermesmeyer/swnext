function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return "";
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const target = `${name}=`;
  const match = parts.find((part) => part.startsWith(target));
  if (!match) return "";
  return decodeURIComponent(match.slice(target.length));
}

function getAccessTokenFromRequest(req) {
  const authHeader = req.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  const cookieToken = getCookieValue(req.headers?.cookie || "", "sb-access-token");
  return cookieToken || "";
}

export default async function handler(req, res) {
  const BIDDING_BACKEND =
    process.env.BIDDING_BACKEND ||
    process.env.BIDDING_API_URL ||
    process.env.NEXT_PUBLIC_BIDDING_BACKEND ||
    process.env.NEXT_PUBLIC_BIDDING_API_URL ||
    "http://localhost:8000";
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join("/") : path;
  const baseUrl = `${BIDDING_BACKEND.replace(/\/$/, "")}/api/${targetPath}`;

  const url = new URL(req.url, "http://localhost");
  url.searchParams.delete("path");
  const fullUrl = `${baseUrl}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}`;

  try {
    const accessToken = getAccessTokenFromRequest(req);
    const headers = {};

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (!["GET", "HEAD"].includes(req.method)) {
      fetchOptions.body = req;
      fetchOptions.duplex = "half";
    }

    const response = await fetch(fullUrl, fetchOptions);
    const contentType = response.headers.get("content-type") || "";
    const contentDisposition = response.headers.get("content-disposition") || "";
    const rawBuffer = Buffer.from(await response.arrayBuffer());

    res.status(response.status);
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    if (contentDisposition) {
      res.setHeader("Content-Disposition", contentDisposition);
    }
    if (contentType.includes("application/json")) {
      try {
        const rawText = rawBuffer.toString("utf-8");
        res.json(rawText ? JSON.parse(rawText) : {});
      } catch {
        res.status(502).json({
          error: "Invalid JSON from bidding backend",
          target: fullUrl,
        });
      }
      return;
    }

    res.send(rawBuffer);
  } catch (error) {
    const status = error?.name === "AbortError" ? 504 : 502;
    res.status(status).json({
      error: status === 504 ? "Bidding backend timed out" : "Failed to connect to bidding backend",
      message: error?.message || "Unknown proxy error",
      target: fullUrl,
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
