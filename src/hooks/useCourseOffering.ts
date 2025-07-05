import { useQuery } from "@tanstack/react-query";
import { getCourseAPIData } from "@utils";
import { toTermCode } from "@utils/format";
import { CourseOutline, CourseWithSectionDetails } from "@types";

export function useCourseOffering(
  course: CourseOutline | undefined,
  term: string,
  enabled: boolean
) {
  const termURL = toTermCode(term);
  const queryUrl = `/sections?term=${termURL}&dept=${course?.dept}&number=${course?.number}`;

  return useQuery<CourseWithSectionDetails>({
    queryKey: ["courseOffering", queryUrl],
    queryFn: () => getCourseAPIData(queryUrl),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
