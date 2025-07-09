import { useQueries } from "@tanstack/react-query";
import { CourseOutline, CourseWithSectionDetails } from "@types";
import { getCourseAPIData } from "@utils";
import { toTermCode } from "@utils/format";

export interface CourseOfferingsResult {
  offerings: CourseWithSectionDetails[];
  isLoadingOfferings: boolean;
  errorOfferings: Error | null;
  isIdleOfferings: boolean;
}

// Show the last 3 offerings
export const useCourseOfferings = (
  course: CourseOutline | undefined
): CourseOfferingsResult => {
  const queries = useQueries({
    queries: course?.offerings
      ? course.offerings.slice(0, 3).map((offering) => {
          const termURL = toTermCode(offering.term);
          const queryUrl = `/sections?term=${termURL}&dept=${course.dept}&number=${course.number}`;
          return {
            queryKey: ["courseOffering", queryUrl],
            queryFn: () => getCourseAPIData(queryUrl).then((res) => res[0]), // array of 1
            staleTime: 24 * 60 * 60 * 1000, // 24 hours
            cacheTime: 24 * 60 * 60 * 1000, // 24 hours
          };
        })
      : [],
  });

  if (!course?.offerings) {
    return {
      offerings: [],
      isLoadingOfferings: false,
      errorOfferings: null,
      isIdleOfferings: true,
    };
  }

  const isLoading = queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error || null;
  const offerings = queries
    .filter((query) => query.data)
    .map((query) => query.data)
    .reverse();

  return {
    offerings,
    isLoadingOfferings: isLoading,
    errorOfferings: error,
    isIdleOfferings: false,
  };
};
