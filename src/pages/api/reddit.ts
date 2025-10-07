import { NextApiRequest, NextApiResponse } from "next";

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
    const response = await fetch(
      `https://www.reddit.com/r/simonfraser/search.json?q=${encodeURIComponent(
        query
      )}&restrict_sr=on&limit=10`,
      {
        headers: {
          "User-Agent": "SFUCourses/1.0",
          Accept: "application/json",
        },
        // Add timeout
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Reddit API error: ${response.status} - ${errorText}`);
      throw new Error(`Reddit API responded with status: ${response.status}`);
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

    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return res.status(408).json({ error: "Request timeout" });
      }
      if (error.message.includes("fetch")) {
        return res.status(503).json({ error: "Network error" });
      }
    }

    res.status(500).json({
      error: "Failed to fetch Reddit posts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
