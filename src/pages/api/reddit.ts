import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const response = await fetch(
      `https://www.reddit.com/r/simonfraser/search.json?q=${encodeURIComponent(
        query
      )}&restrict_sr=on`,
      {
        headers: {
          "User-Agent": "SFUCourses/1.0",
        },
      }
    );

    if (!response.ok) {
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
    res.status(500).json({ error: "Failed to fetch Reddit posts" });
  }
}
