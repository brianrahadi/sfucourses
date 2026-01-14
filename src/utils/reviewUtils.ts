import { InstructorReviewSummary } from "@types";
import { INSTRUCTOR_RMP_NAME_MAPPING } from "@const";

export const getInstructorReviewData = (
  instructorName: string,
  reviews: InstructorReviewSummary[] | undefined
): InstructorReviewSummary | null => {
  if (!reviews) return null;

  const name = INSTRUCTOR_RMP_NAME_MAPPING[instructorName] || instructorName;

  return (
    reviews.find(
      (review) => review.Name.toLowerCase() === name.toLowerCase()
    ) || null
  );
};
