import { useQuery } from "@tanstack/react-query";
import { CourseOutline } from "@types";
import { getCourseAPIData } from "@utils";

/**
 * Custom hook to fetch and cache course outlines data
 * Supports SSR with initial data
 */
export function useCoursesData(initialData?: {
  courses: CourseOutline[];
  totalCount: number;
}) {
  const {
    data: coursesData,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["allCourses"],
    queryFn: async () => {
      try {
        const response = await getCourseAPIData("/outlines/all");
        return {
          courses: response.data as CourseOutline[],
          totalCount: response.total_count as number,
        };
      } catch (err) {
        console.error("Error fetching all courses:", err);
        throw err;
      }
    },
    // Use initial data if provided (from SSR)
    initialData: initialData,
    // Only fetch if no initial data is provided
    enabled: !initialData,
    // Cache the data for 1 hour
    staleTime: 60 * 60 * 1000,
  });

  return {
    courses: coursesData?.courses || [],
    totalCount: coursesData?.totalCount || 0,
    isLoading,
    error: isError ? error : null,
  };
}

export default useCoursesData;
