import type { CourseOutline, CourseReviewSummary } from "@types";
import { getCourseAPIData } from "@utils";

/** Everything /explore needs in courses mode, served by /api/explore-data. */
export interface ExploreData {
  courses: CourseOutline[];
  courseReviews: CourseReviewSummary[];
}

/** The explore page's query key for ExploreData. */
export const EXPLORE_DATA_KEY = ["exploreData"];

// Only the fields the explore list uses (it has ~3,600 courses).
const EXPLORE_COURSE_FIELDS = [
  "dept",
  "number",
  "title",
  "units",
  "description",
  "designation",
  "deliveryMethod",
  "prerequisites",
  // The course page's prerequisites section, shown from this data while the
  // page loads, also lists corequisites.
  "corequisites",
  "offerings",
] as const;

/** Server-side: fetch and slim the explore data from the API. */
export async function loadExploreData(): Promise<ExploreData> {
  const [outlines, courseReviews] = await Promise.all([
    getCourseAPIData("/outlines") as Promise<CourseOutline[]>,
    getCourseAPIData("/reviews/courses") as Promise<CourseReviewSummary[]>,
  ]);
  const courses = outlines.map(
    (course) =>
      Object.fromEntries(
        EXPLORE_COURSE_FIELDS.filter((f) => course[f] !== undefined).map(
          (f) => [f, course[f]]
        )
      ) as unknown as CourseOutline
  );
  return { courses, courseReviews };
}

/** Browser-side: the full explore data, cached by the CDN and the browser. */
export async function fetchExploreData(): Promise<ExploreData> {
  const response = await fetch("/api/explore-data");
  if (!response.ok) {
    throw new Error(`Explore data HTTP ${response.status}`);
  }
  return response.json();
}
