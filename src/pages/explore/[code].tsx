import { CourseTabContainer, Hero, TabContainer } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { formatDate, formatShortDate, getData, loadData } from "@utils";
import { CourseOutline, CourseWithSectionDetails } from "@types";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "next/router";

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

// import React from 'react';
// import './CourseTabContainer.scss';

// interface Schedule {
//   days: string;
//   startTime: string;
//   endTime: string;
//   campus: string;
// }

// interface Section {
//   section: string;
//   classNumber: string;
//   enrolled?: string;
//   schedules?: Schedule[];
//   instructors?: { name: string }[];
//   deliveryMethod?: string;
// }

// interface CourseWithSectionDetails {
//   sections: Section[];
// }

const CourseOfferingSection: React.FC<{
  offering: CourseWithSectionDetails;
}> = ({ offering }) => {
  return (
    <div className="offering">
      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>Class</th>
            <th>Time</th>
            <th>Day</th>
            <th>Date</th>
            <th>Instructor</th>
          </tr>
        </thead>
        <tbody>
          {offering.sections?.length > 0 ? (
            offering.sections.map((section, index) => {
              const schedules = section.schedules || [];
              const instructors =
                section.instructors
                  ?.map((instructor) => instructor.name)
                  .join(", ") || "N/A";

              // If there are no schedules, render a single row
              if (schedules.length === 0) {
                return (
                  <tr key={index} className="section-details">
                    <td>{section.section}</td>
                    <td>{section.classNumber}</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>{instructors}</td>
                  </tr>
                );
              }

              // If there are schedules, render a row for each schedule
              return schedules.map((schedule, scheduleIndex) => (
                <tr
                  key={`${index}-${scheduleIndex}`}
                  className="section-details"
                >
                  {scheduleIndex === 0 && (
                    <>
                      <td rowSpan={schedules.length}>{section.section}</td>
                      <td rowSpan={schedules.length}>{section.classNumber}</td>
                    </>
                  )}
                  <td>{`${schedule.startTime} - ${schedule.endTime}`}</td>
                  <td>{schedule.days}</td>
                  <td>{`${formatShortDate(
                    schedule.startDate
                  )} - ${formatShortDate(schedule.endDate)}`}</td>

                  {scheduleIndex === 0 && (
                    <>
                      <td rowSpan={schedules.length}>{instructors}</td>
                    </>
                  )}
                </tr>
              ));
            })
          ) : (
            <tr>
              <td colSpan={5}>No section details available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
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

  // Prepare tabs for the TabContainer
  const tabs = offerings.map((offering) => ({
    id: offering.term,
    label: offering.term,
    content: <CourseOfferingSection offering={offering} />,
  }));

  return (
    <div className="page courses-page">
      <Hero
        title="explore courses - page in progress tee hee"
        backgroundImage={HeroImage.src}
      />
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
          </div>
        </div>

        {/* Use TabContainer for course offerings */}
        <div className="course-offerings">
          {isIdle ? (
            "Waiting for course data..."
          ) : error ? (
            `Error loading offerings: ${error.message}`
          ) : offerings.length === 0 ? (
            "No offerings available"
          ) : (
            <CourseTabContainer tabs={tabs} />
          )}
        </div>
      </main>
    </div>
  );
};

export default CoursePage;
