import { NextApiRequest, NextApiResponse } from "next";

export const config = { runtime: "nodejs" };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), 15000)
      : null;
    const userAgent = "web:sfucourses:1.0 (by /u/SnooCrickets3094)"; // my account

    const response = await fetch(
      `https://www.reddit.com/r/simonfraser/search.json?q=${encodeURIComponent(
        query
      )}&restrict_sr=on&limit=10`,
      {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
        signal: controller?.signal,
      }
    );

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Reddit API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({
        error: "Reddit API error",
        status: response.status,
      });
    }

    const data = await response.json();

    const posts = data.data.children.map((post: any) => ({
      title: post.data.title,
      upvotes: post.data.ups,
      date_created: new Date(post.data.created_utc * 1000),
      url: `https://www.reddit.com${post.data.permalink}`,
    }));

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching Reddit posts:", error);
    if (error instanceof Error && error.name === "AbortError") {
      return res.status(408).json({ error: "Request timeout" });
    }
    if (
      error instanceof Error &&
      /fetch failed|ENOTFOUND|ECONNRESET|EAI_AGAIN/i.test(error.message)
    ) {
      return res.status(503).json({ error: "Network error" });
    }
    return res.status(500).json({
      error: "Failed to fetch Reddit posts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
