// pages/api/courses/search-index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { CourseOutline } from "@types";
import { getCourseAPIData } from "@utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Fetch courses from the API
    const response = await getCourseAPIData("/outlines/all");
    const courses: CourseOutline[] = response.data;

    // Create a minimal version of each course for search
    const searchCourses = courses.map((course) => ({
      dept: course.dept,
      number: course.number,
      title: course.title,
    }));

    res.status(200).json(searchCourses);
  } catch (error) {
    console.error("Error fetching search index:", error);
    res.status(500).json({ error: "Failed to fetch course data" });
  }
}
