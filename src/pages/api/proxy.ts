import type { NextApiRequest, NextApiResponse } from "next";
import { API_ORIGIN, fetchFromApi } from "../../lib/api-wrapper";

// Let Vercel's CDN cache proxied responses, so repeat requests are served from
// the edge without running this function or calling the API.
// The API's data syncs hourly; /health is used for "last updated" info.
const CACHE_CONTROL_DEFAULT =
  "public, s-maxage=3600, stale-while-revalidate=86400";
const CACHE_CONTROL_HEALTH = "public, s-maxage=60, stale-while-revalidate=300";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { path } = req.query;

  if (!path || typeof path !== "string") {
    return res.status(400).json({ error: "Path parameter is required" });
  }

  // Build the full target URL relative to the API root
  const targetUrl = `${API_ORIGIN}${path}`;

  try {
    const data = await fetchFromApi(targetUrl);
    res.setHeader(
      "Cache-Control",
      path === "/health" ? CACHE_CONTROL_HEALTH : CACHE_CONTROL_DEFAULT
    );
    res.status(200).json(data);
  } catch (error: any) {
    console.error("Proxy error:", error);
    res.setHeader("Cache-Control", "no-store");
    const message: string = error?.message || "Internal server error";
    // Pass "not found" through so the client can show it as such
    const status = message.includes("External API error: 404") ? 404 : 500;
    res.status(status).json({ error: message });
  }
}
