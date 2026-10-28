import type { NextApiRequest, NextApiResponse } from "next";
import { getCourseAPIData } from "@utils";
import type { SearchIndex } from "src/hooks/useSearchIndex";

// Served from Vercel's CDN; the underlying data syncs hourly.
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

/**
 * A compact index for the search boxes: course codes/titles and instructor
 * names only (~10% of the full /outlines + /instructors payloads).
 */
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<SearchIndex | { error: string }>
) {
  try {
    const [outlines, instructors] = await Promise.all([
      getCourseAPIData("/outlines", { short: "true" }),
      getCourseAPIData("/instructors"),
    ]);

    res.setHeader("Cache-Control", CACHE_CONTROL);
    res.status(200).json({
      courses: outlines.map((course: any) => ({
        dept: course.dept,
        number: course.number,
        title: course.title,
      })),
      instructors: instructors.map((instructor: any) => ({
        name: instructor.name,
      })),
    });
  } catch (error) {
    console.error("Error building search index:", error);
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ error: "Failed to build search index" });
  }
}
