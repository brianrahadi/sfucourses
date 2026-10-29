import type { NextApiRequest, NextApiResponse } from "next";
import { ExploreData, loadExploreData } from "src/lib/exploreData";

// The API syncs hourly. Browsers reuse the file for 10 minutes and the CDN
// for an hour, serving a stale copy while it refreshes.
const CACHE_CONTROL =
  "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400";

/**
 * The full course list for /explore. Kept out of the page's HTML so the
 * first cards render immediately; it loads in parallel and stays cached.
 */
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<ExploreData | { error: string }>
) {
  try {
    const data = await loadExploreData();
    res.setHeader("Cache-Control", CACHE_CONTROL);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error building explore data:", error);
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ error: "Failed to load explore data" });
  }
}
