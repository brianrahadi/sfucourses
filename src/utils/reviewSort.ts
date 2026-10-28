import { Review } from "@types";

// Handles formats like "Aug 19th, 2025" or "Sep 1st, 2020"
export const parseReviewDate = (dateStr: string): Date => {
  const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");
  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const newestFirst = (a: Review, b: Review) =>
  parseReviewDate(b.date).getTime() - parseReviewDate(a.date).getTime();

/** Returns a sorted copy of `reviews` for the review list's sort dropdown. */
export function sortReviews<T extends Review>(
  reviews: T[],
  option: string
): T[] {
  const sorted = [...reviews];
  switch (option) {
    case "most-recent":
      return sorted.sort(newestFirst);
    case "least-recent":
      return sorted.sort((a, b) => newestFirst(b, a));
    case "hardest":
      return sorted.sort(
        (a, b) =>
          parseFloat(b.difficulty) - parseFloat(a.difficulty) ||
          newestFirst(a, b)
      );
    case "easiest":
      return sorted.sort(
        (a, b) =>
          parseFloat(a.difficulty) - parseFloat(b.difficulty) ||
          newestFirst(a, b)
      );
    case "most-liked":
      return sorted.sort(
        (a, b) =>
          (parseInt(b.helpful) || 0) - (parseInt(a.helpful) || 0) ||
          newestFirst(a, b)
      );
    case "most-disliked":
      return sorted.sort(
        (a, b) =>
          (parseInt(b.not_helpful) || 0) - (parseInt(a.not_helpful) || 0) ||
          newestFirst(a, b)
      );
    default:
      return sorted;
  }
}

/** Average rating and difficulty of `reviews` (0 when there are none). */
export function reviewAverages(reviews: Review[]) {
  if (reviews.length === 0) return { avgRating: 0, avgDifficulty: 0 };
  let rating = 0;
  let difficulty = 0;
  for (const review of reviews) {
    rating += parseFloat(review.rating);
    difficulty += parseFloat(review.difficulty);
  }
  return {
    avgRating: rating / reviews.length,
    avgDifficulty: difficulty / reviews.length,
  };
}

/** Counts of reviews per rounded rating and difficulty (1–5). */
export function reviewDistributions(reviews: Review[]) {
  const ratingCounts = [0, 0, 0, 0, 0];
  const difficultyCounts = [0, 0, 0, 0, 0];
  for (const review of reviews) {
    const rating = Math.round(parseFloat(review.rating));
    const difficulty = Math.round(parseFloat(review.difficulty));
    if (rating >= 1 && rating <= 5) ratingCounts[rating - 1]++;
    if (difficulty >= 1 && difficulty <= 5) difficultyCounts[difficulty - 1]++;
  }
  return { ratingCounts, difficultyCounts };
}
