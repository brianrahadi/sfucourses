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

/** How many of a course's most recent offerings the course page shows. */
export const RECENT_OFFERINGS_COUNT = 3;

/** The query key/URL for one term's sections of a course. */
export function courseOfferingQuery(
  dept: string,
  number: string,
  term: string
) {
  const queryUrl = `/sections?term=${toTermCode(
    term
  )}&dept=${dept}&number=${number}`;
  return { queryKey: ["courseOffering", queryUrl], queryUrl };
}

// Load the last 3 offerings in parallel. On the course page they are usually
// already in the cache, prefetched by getStaticProps.
export const useCourseOfferings = (
  course: CourseOutline | undefined
): CourseOfferingsResult => {
  const rawOfferings =
    course?.offerings?.slice(0, RECENT_OFFERINGS_COUNT) ?? [];

  const results = useQueries({
    queries: rawOfferings.map((offering) => {
      const { queryKey, queryUrl } = courseOfferingQuery(
        course?.dept ?? "",
        course?.number ?? "",
        offering.term
      );
      return {
        queryKey,
        queryFn: () => getCourseAPIData(queryUrl).then((res) => res[0]),
        staleTime: 24 * 60 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
      };
    }),
  });

  const offerings = rawOfferings
    .map((offering, idx) => {
      const result = results[idx];
      if (result?.data) {
        return {
          ...(result.data as CourseWithSectionDetails),
          isLoading: false,
        };
      }
      return {
        dept: course?.dept ?? "",
        number: course?.number ?? "",
        title: course?.title ?? "",
        units: course?.units ?? "",
        term: offering.term,
        sections: [],
        isLoading: result?.isLoading ?? true,
      };
    })
    .reverse();

  const isLoadingOfferings = false; // Always false so headers show immediately
  const errorOfferings = results.find((r) => r.error)?.error ?? null;
  const isIdleOfferings = false; // Always false to allow rendering

  return {
    offerings: offerings as CourseWithSectionDetails[],
    isLoadingOfferings,
    errorOfferings,
    isIdleOfferings,
  };
};
