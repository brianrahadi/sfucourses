/**
 * Server-side data loading for the statically generated course and
 * instructor pages. Everything a page needs is fetched in parallel here, so
 * the browser receives a complete page instead of loading it piece by piece.
 */
import { dehydrate, QueryClient } from "@tanstack/react-query";
import type { DehydratedState } from "@tanstack/react-query";
import type {
  CourseOutline,
  CourseReviewSummary,
  Instructor,
  InstructorReviewData,
  InstructorReviewSummary,
  Review,
} from "@types";
import { INSTRUCTOR_RMP_NAME_MAPPING } from "@const";
import { API_ORIGIN, fetchFromApi } from "./api-wrapper";
import {
  courseOfferingQuery,
  RECENT_OFFERINGS_COUNT,
} from "../hooks/UseCourseOfferings";

/** How often a generated page is refreshed; the API syncs hourly. */
export const PAGE_REVALIDATE_SECONDS = 60 * 60;

const TIMEOUT_MS = 10_000;

class NotFoundError extends Error {}

/** Fetch from the API with a timeout and one retry on transient failures. */
async function api<T>(path: string): Promise<T> {
  const url = `${API_ORIGIN}/v1/rest${path}`;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchFromApi(url, { timeoutMs: TIMEOUT_MS });
    } catch (err: any) {
      if (String(err?.message).includes("External API error: 404")) {
        throw new NotFoundError(path);
      }
      if (attempt >= 1) throw err;
    }
  }
}

/** Like api(), but resolves to null when the resource doesn't exist. */
async function apiOrNull<T>(path: string): Promise<T | null> {
  try {
    return await api<T>(path);
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}

// ── Course page ────────────────────────────────────────────────────────────

export interface CourseInstructorReviews {
  professor_id: string;
  professor_name: string;
  department: string;
  avg_rating: number;
  avg_difficulty: number;
  review_count: number;
  would_take_again: string;
  reviews: Review[];
}

export interface CourseReviewData {
  course_code: string;
  total_reviews: number;
  instructors: CourseInstructorReviews[];
}

export interface CoursePageProps {
  course: CourseOutline;
  reviews: CourseReviewData | null;
  dehydratedState: DehydratedState;
}

/** Parses "cmpt-225" into its department and number. */
export function parseCourseCode(code: string | undefined) {
  const [dept, number, ...rest] = (code ?? "").split("-");
  if (!dept || !number || rest.length > 0) return null;
  return { dept: dept.toLowerCase(), number: number.toLowerCase() };
}

export async function loadCoursePage(
  code: string | undefined
): Promise<CoursePageProps | null> {
  const parsed = parseCourseCode(code);
  if (!parsed) return null;
  const { dept, number } = parsed;

  const [outlines, reviews] = await Promise.all([
    api<CourseOutline[]>(`/outlines?dept=${dept}&number=${number}`),
    apiOrNull<CourseReviewData>(
      `/reviews/courses/${dept.toUpperCase()}${number.toUpperCase()}`
    ),
  ]);
  const course = outlines?.[0];
  if (!course) return null;

  // Seed the react-query cache with the sections useCourseOfferings needs,
  // so the offerings tabs render complete on the first paint.
  const queryClient = new QueryClient();
  await Promise.all(
    (course.offerings ?? [])
      .slice(0, RECENT_OFFERINGS_COUNT)
      .map(async (offering) => {
        const { queryKey, queryUrl } = courseOfferingQuery(
          course.dept,
          course.number,
          offering.term
        );
        try {
          const sections = await api<unknown[]>(queryUrl);
          if (sections?.[0]) queryClient.setQueryData(queryKey, sections[0]);
        } catch {
          // Missing sections are fetched by the browser instead.
        }
      })
  );

  return {
    course,
    reviews: reviews?.instructors ? reviews : null,
    dehydratedState: dehydrate(queryClient),
  };
}

/** Codes ("cmpt-225") of the most-reviewed courses, prerendered at build. */
export async function popularCourseCodes(limit: number): Promise<string[]> {
  if (limit <= 0) return [];
  const [outlines, summaries] = await Promise.all([
    api<Pick<CourseOutline, "dept" | "number">[]>("/outlines?short=true"),
    api<CourseReviewSummary[]>("/reviews/courses"),
  ]);
  const codes = new Map(
    outlines.map((o) => [`${o.dept}${o.number}`.toUpperCase(), o])
  );
  return summaries
    .filter((s) => codes.has(s.course_code.toUpperCase()))
    .sort((a, b) => b.total_reviews - a.total_reviews)
    .slice(0, limit)
    .map((s) => {
      const o = codes.get(s.course_code.toUpperCase())!;
      return `${o.dept.toLowerCase()}-${o.number}`;
    });
}

// ── Instructor page ────────────────────────────────────────────────────────

export interface InstructorPageProps {
  instructor: Instructor;
  reviews: InstructorReviewData | null;
}

export type InstructorPageResult =
  | { kind: "page"; props: InstructorPageProps }
  | { kind: "redirect"; name: string }
  | { kind: "notFound" };

export function reviewNameFor(instructorName: string) {
  return (
    INSTRUCTOR_RMP_NAME_MAPPING[instructorName] || instructorName
  ).replace(/\s+/g, "_");
}

export async function loadInstructorPage(
  name: string
): Promise<InstructorPageResult> {
  const matches = await apiOrNull<Instructor[]>(
    `/instructors?name=${encodeURIComponent(name)}`
  );
  if (!matches || matches.length === 0) return { kind: "notFound" };

  // The API matches by substring; prefer the exact (case-insensitive) name.
  const exact = matches.find(
    (i) => i.name.toLowerCase() === name.toLowerCase()
  );
  const instructor = exact ?? matches[0];

  // "/instructors/brian fraser" → "/instructors/Brian Fraser", so every
  // spelling shares one cached page.
  if (exact && exact.name !== name) {
    return { kind: "redirect", name: exact.name };
  }

  const reviews = await apiOrNull<InstructorReviewData>(
    `/reviews/instructors/${encodeURIComponent(reviewNameFor(instructor.name))}`
  );

  return { kind: "page", props: { instructor, reviews } };
}

/** Names of the most-reviewed instructors, prerendered at build. */
export async function popularInstructorNames(limit: number): Promise<string[]> {
  if (limit <= 0) return [];
  const [instructors, summaries] = await Promise.all([
    api<Instructor[]>("/instructors"),
    api<InstructorReviewSummary[]>("/reviews/instructors"),
  ]);
  const ratings = new Map(
    summaries.map((s) => [s.Name.toLowerCase(), parseInt(s.Ratings) || 0])
  );
  const count = (name: string) =>
    ratings.get((INSTRUCTOR_RMP_NAME_MAPPING[name] || name).toLowerCase()) ?? 0;
  return instructors
    .map((i) => i.name)
    .filter((name) => count(name) > 0)
    .sort((a, b) => count(b) - count(a))
    .slice(0, limit);
}

/** Number of pages to prerender at build; the rest are generated on demand. */
export function prerenderLimit(envVar: string | undefined, fallback: number) {
  const n = envVar === undefined ? fallback : parseInt(envVar, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
