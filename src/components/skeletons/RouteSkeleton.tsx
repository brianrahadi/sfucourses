import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CourseOutline, CourseReviewSummary } from "@types";
import { Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useExploreStore } from "src/store/useExploreStore";
import { CoursePageSkeleton } from "./CoursePageSkeleton";
import { InstructorPageSkeleton } from "./InstructorPageSkeleton";
import { ExplorePageSkeleton } from "./ExplorePageSkeleton";

export type SkeletonRoute =
  | { page: "course"; code: string }
  | { page: "instructor"; name: string }
  | { page: "explore" };

/** Which skeleton (if any) to show while navigating to `url`. */
export function skeletonRouteFor(url: string): SkeletonRoute | null {
  const path = url.split(/[?#]/)[0];
  let match = path.match(/^\/explore\/([^/]+)\/?$/);
  if (match) return { page: "course", code: decodeURIComponent(match[1]) };
  match = path.match(/^\/instructors\/([^/]+)\/?$/);
  if (match) return { page: "instructor", name: decodeURIComponent(match[1]) };
  if (/^\/explore\/?$/.test(path)) return { page: "explore" };
  return null;
}

/** Renders the destination page's skeleton during in-app navigation. */
export const RouteSkeleton: React.FC<{ route: SkeletonRoute }> = ({
  route,
}) => {
  const queryClient = useQueryClient();
  const mode = useExploreStore((state) => state.mode);

  if (route.page === "course") {
    // Coming from /explore, the outline is already in the cache: show the
    // real header and prerequisites now and skeletons for the rest.
    const [dept, number] = route.code.toUpperCase().split("-");
    const course = queryClient
      .getQueryData<CourseOutline[]>(["exploreCourses"])
      ?.find((c) => c.dept === dept && c.number.toUpperCase() === number);
    const summaries = queryClient.getQueryData<CourseReviewSummary[]>([
      "courseReviews",
    ]);
    const summary = summaries?.find(
      (s) => s.course_code.toUpperCase() === `${dept}${number}`
    );
    const totalReviews =
      course && summaries ? summary?.total_reviews ?? 0 : undefined;
    return <CoursePageSkeleton course={course} totalReviews={totalReviews} />;
  }

  if (route.page === "instructor") {
    return <InstructorPageSkeleton />;
  }

  return (
    <ExplorePageSkeleton
      mode={mode}
      hero={<Hero title={`explore ${mode}`} backgroundImage={HeroImage.src} />}
    />
  );
};

export default RouteSkeleton;
