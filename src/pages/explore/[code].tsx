import {
  ExploreFilter,
  Hero,
  TextBadge,
  CourseCard,
  SearchBar,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { getData, loadData, numberWithCommas } from "@utils";
import { CourseOutline, CourseWithSectionDetails } from "@types";
import InfiniteScroll from "react-infinite-scroll-component";
import { useExploreFilters } from "src/hooks/UseExploreFilters";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { termToIcon } from "src/components/ExploreFilter";
import { useQueries, useQueryClient } from "@tanstack/react-query";

interface CoursePageProps {}

interface CourseCode {
  dept: string | undefined;
  number: string | undefined;
}

interface CourseOfferingsResult {
  offerings: CourseWithSectionDetails[];
  isLoading: boolean;
  error: Error | null;
  isIdle: boolean;
}

const useCourseOfferings = (
  course: CourseOutline | undefined
): CourseOfferingsResult => {
  // Always call useQueries, but with an empty array if no course
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
      : [], // Empty array when no course
  });

  // If no course, return idle state
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
    .map((query) => query.data);

  return {
    offerings,
    isLoading,
    error,
    isIdle: false,
  };
};

const CoursePage: React.FC<CoursePageProps> = () => {
  const router = useRouter();
  const { code } = router.query;

  const courseStrs =
    typeof code === "string" ? code.toLowerCase().split("-") : [];
  const courseCode: CourseCode = {
    dept: courseStrs[0] || undefined,
    number: courseStrs[1] || undefined,
  };

  const [course, setCourse] = useState<CourseOutline | undefined>();

  useEffect(() => {
    if (courseCode.dept && courseCode.number) {
      loadData(`/outlines/${courseCode.dept}/${courseCode.number}`, setCourse);
    }
  }, [courseCode.dept, courseCode.number]);

  // This hook will now be called consistently every render
  const { offerings, isLoading, error, isIdle } = useCourseOfferings(course);

  if (!courseCode.dept || !courseCode.number) {
    return (
      <div className="page courses-page">
        <Hero title="explore courses" backgroundImage={HeroImage.src} />
        <main className="container">Invalid course code provided</main>
      </div>
    );
  }

  if (!course || isLoading) {
    return (
      <div className="page courses-page">
        <Hero title="explore courses" backgroundImage={HeroImage.src} />
        <main className="container">Loading...</main>
      </div>
    );
  }

  return (
    <div className="page courses-page">
      <Hero title="explore courses" backgroundImage={HeroImage.src} />
      <main className="container">
        <div className="course-card-page">
          <div className="course-title dark">
            {`${course.dept} ${course.number} - ${course.title} (${course.units})`}
          </div>
          <div className="course-card__content">
            <p className="course-description">
              {course.description}
              {course.designation && course.designation != "N/A"
                ? " " + course.designation
                : ""}
            </p>
            <p className="course-description">
              Prerequisite: {course.prerequisites || "None"}
            </p>

            <div className="course-card__row">
              {course.offerings
                .filter((offering) => offering.instructors.length !== 0)
                .map((offering) => {
                  const text = `${offering.instructors[0]}${
                    offering.instructors.length > 1
                      ? ` +${offering.instructors.length - 1}`
                      : ""
                  }`;
                  return (
                    <div
                      className="text-badge"
                      key={offering.instructors + offering.term}
                    >
                      {termToIcon(offering.term.split(" ")[0])}
                      {offering.term.split(" ")[1].slice(2)}
                      <p>{text}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        <div>
          {isIdle
            ? "Waiting for course data..."
            : error
            ? `Error loading offerings: ${error.message}`
            : offerings.length === 0
            ? "No offerings available"
            : offerings.map((offering) => {
                return (
                  <div key={offering.dept + offering.number + offering.term}>
                    {offering?.sectionDetails?.map((section) => {
                      return JSON.stringify(section);
                    })}
                  </div>
                );
              })}
        </div>
      </main>
    </div>
  );
};

export default CoursePage;
