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

export const useCourseOfferings = (
  course: CourseOutline | undefined
): CourseOfferingsResult => {
  const courseCodeURL = course ? `${course.dept}/${course.number}` : "";
  const queries = useQueries({
    queries: course?.offerings
      ? course.offerings.map((offering) => {
          const termURL = toTermCode(offering.term);
          const queryUrl = `/sections/${termURL}/${courseCodeURL}`;
          return {
            queryKey: ["courseOffering", queryUrl],
            queryFn: () => getCourseAPIData(queryUrl),
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
