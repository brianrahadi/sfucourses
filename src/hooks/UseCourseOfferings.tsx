import { useQueries, useQuery } from "@tanstack/react-query";
import { CourseOutline, CourseWithSectionDetails } from "@types";
import { getCourseAPIData } from "@utils";
import { toTermCode } from "@utils/format";
import { useEffect, useState } from "react";

export interface CourseOfferingsResult {
  offerings: CourseWithSectionDetails[];
  isLoadingOfferings: boolean;
  errorOfferings: Error | null;
  isIdleOfferings: boolean;
}

// Lazy load last 3 offerings, one by one
export const useCourseOfferings = (
  course: CourseOutline | undefined
): CourseOfferingsResult => {
  const [loadCount, setLoadCount] = useState(1);

  // Only proceed if course and offerings exist
  const offerings = course?.offerings?.slice(0, 3) ?? [];

  // Prepare queries for up to 3 offerings, but only enable as needed
  const queries = offerings.map((offering, idx) => {
    const termURL = toTermCode(offering.term);
    const queryUrl = `/sections?term=${termURL}&dept=${course?.dept}&number=${course?.number}`;
    return {
      queryKey: ["courseOffering", queryUrl],
      queryFn: () => getCourseAPIData(queryUrl).then((res) => res[0]),
      enabled: idx < loadCount,
      staleTime: 24 * 60 * 60 * 1000,
      cacheTime: 24 * 60 * 60 * 1000,
    };
  });

  const results = useQueries({ queries });

  // When the latest loaded query is done, increment loadCount to load the next
  useEffect(() => {
    if (loadCount < offerings.length) {
      const prevResult = results[loadCount - 1];
      if (prevResult && prevResult.isSuccess) {
        setLoadCount(loadCount + 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, loadCount, offerings.length]);

  const isLoadingOfferings = results.some(
    (r, idx) => idx < loadCount && r.isLoading
  );
  const errorOfferings = results.find((r) => r.error)?.error ?? null;
  const isIdleOfferings = results.every(
    (r, idx) => idx >= loadCount || r.isIdle
  );

  return {
    offerings: results
      .map((r) => r.data)
      .filter(Boolean) as CourseWithSectionDetails[],
    isLoadingOfferings,
    errorOfferings,
    isIdleOfferings,
  };
};
