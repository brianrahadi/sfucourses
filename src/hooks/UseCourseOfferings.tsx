import { useQueries } from "@tanstack/react-query";
import { CourseOutline, CourseWithSectionDetails } from "@types";
import { getData } from "@utils";

export interface CourseOfferingsResult {
  offerings: CourseWithSectionDetails[];
  isLoading: boolean;
  error: Error | null;
  isIdle: boolean;
}

export const useCourseOfferings = (
  course: CourseOutline | undefined
): CourseOfferingsResult => {
  const courseCodeURL = course ? `${course.dept}/${course.number}` : "";
  const queries = useQueries({
    queries: course?.offerings
      ? course.offerings.map((offering) => {
          const termURL = offering.term
            .toLowerCase()
            .split(" ")
            .reverse()
            .join("/");
          const queryUrl = `/courses/${termURL}/${courseCodeURL}`;
          return {
            queryKey: ["courseOffering", queryUrl],
            queryFn: () => getData(queryUrl),
            staleTime: 5 * 60 * 1000,
            cacheTime: 30 * 60 * 1000,
          };
        })
      : [],
  });

  if (!course?.offerings) {
    return {
      offerings: [],
      isLoading: false,
      error: null,
      isIdle: true,
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
    isLoading,
    error,
    isIdle: false,
  };
};
