import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const userAgent = "web:sfucourses:1.0 (by /u/SnooCrickets3094)";
    const { data } = await axios.get(
      `https://www.reddit.com/r/simonfraser/search.json`,
      {
        params: {
          q: query,
          restrict_sr: "on",
          limit: 10,
        },
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
        validateStatus: () => true,
      }
    );

    if (!data || !data.data || !Array.isArray(data.data.children)) {
      return res.status(502).json({ error: "Invalid Reddit response" });
    }

    const posts = data.data.children.map((post: any) => ({
      title: post.data.title,
      upvotes: post.data.ups,
      date_created: new Date(post.data.created_utc * 1000),
      url: `https://www.reddit.com${post.data.permalink}`,
    }));

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching Reddit posts:", error);
    return res.status(500).json({ error: "Failed to fetch Reddit posts" });
  }
}
