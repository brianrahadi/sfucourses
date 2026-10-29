// pages/api/courses/search-index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getCourseAPIData } from "@utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // The short outline omits descriptions, offerings, etc.
    const courses = await getCourseAPIData("/outlines", { short: "true" });

    // Create a minimal version of each course for search
    const searchCourses = courses.map((course: any) => ({
      dept: course.dept,
      number: course.number,
      title: course.title,
    }));

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.status(200).json(searchCourses);
  } catch (error) {
    console.error("Error fetching search index:", error);
    res.status(500).json({ error: "Failed to fetch course data" });
  }
}
