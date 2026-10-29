import { createContext } from "react";
import { InstructorReviewSummary } from "@types";

/**
 * Ratings for just the instructors on the current page, provided by pages
 * that load them server-side (the course page). Components fall back to
 * fetching the full /reviews/instructors list when it isn't provided.
 */
export const InstructorRatingsContext = createContext<
  InstructorReviewSummary[] | null
>(null);
