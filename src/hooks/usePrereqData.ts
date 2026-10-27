import { useQuery } from "@tanstack/react-query";
import { getCourseAPIData } from "@utils";
import { PrereqGraphEntry, PrereqTrees } from "@utils/prereqs";

const HOUR = 60 * 60 * 1000;

/**
 * Per-course prerequisite graph (groups, corequisites, exclusions). Falls back
 * to the bundled snapshot if the API is unreachable or predates the endpoint.
 */
export function usePrereqGraph() {
  return useQuery({
    queryKey: ["prereqGraph"],
    queryFn: async (): Promise<PrereqGraphEntry[]> => {
      try {
        const data = await getCourseAPIData("/prerequisites/graph");
        if (Array.isArray(data) && data.length > 0) return data;
        throw new Error("empty prerequisite graph");
      } catch (err) {
        console.warn("Using bundled prerequisite snapshot:", err);
        const res = await fetch("/courses/courses.json");
        return res.json();
      }
    },
    staleTime: HOUR,
  });
}

/** Full and/or requirement trees, including unit and permission conditions. */
export function usePrereqTrees() {
  return useQuery({
    queryKey: ["prereqTrees"],
    queryFn: async (): Promise<PrereqTrees> =>
      getCourseAPIData("/prerequisites"),
    staleTime: HOUR,
    retry: 1,
  });
}
