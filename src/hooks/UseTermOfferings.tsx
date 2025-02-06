import { useQuery } from "@tanstack/react-query";
import { CourseWithSectionDetails } from "@types";
import { getData } from "@utils";

export interface TermOfferingsResult {
  offerings: CourseWithSectionDetails[];
  isLoading: boolean;
  error: Error | null;
}

export const useTermOfferings = (
  term: string // Term in the format "Fall 2024" or "Spring 2025"
): TermOfferingsResult => {
  const termURL = term
    ? term.toLowerCase().split(" ").reverse().join("/") // Convert "Fall 2024" to "2024/fall"
    : "";

  const query = useQuery<CourseWithSectionDetails[], Error>({
    queryKey: ["termOfferings", termURL],
    queryFn: () => getData(`/courses/${termURL}`),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Provide a default value for offerings
  const offerings = query.data || [];

  console.log(offerings);

  return {
    offerings,
    isLoading: query.isLoading,
    error: query.error,
  };
};
