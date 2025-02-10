import { CourseTabContainer, Hero, RedditPosts } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import {
  formatShortDate,
  generateBaseOutlinePath,
  loadCourseAPIData,
  onlyUnique,
} from "@utils";
import { CourseOutline, CourseWithSectionDetails } from "@types";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "next/router";
import Link from "next/link";
import { CiCalendar, CiClock1 } from "react-icons/ci";
import { BsFillPersonFill } from "react-icons/bs";
import { FaTimeline } from "react-icons/fa6";
import { useCourseOfferings } from "@hooks";

interface CoursePageProps {}

interface CourseCode {
  dept: string | undefined;
  number: string | undefined;
}

const CourseOfferingSection: React.FC<{
  offering: CourseWithSectionDetails;
}> = ({ offering }) => {
  const [showLabTut, setShowLabTut] = useState(false);
  const notLabOrTut = (sectionCode: string) =>
    sectionCode !== "LAB" && sectionCode !== "TUT";
  const nonLabTutSections = offering.sections.filter((section) =>
    section.schedules.every((sched) => notLabOrTut(sched.sectionCode))
  );
  const hasLabTut = offering.sections.length !== nonLabTutSections.length;
  const shownSections = showLabTut ? offering.sections : nonLabTutSections;
  return (
    <div
      key={offering.term + offering.dept + offering.number}
      className="offering"
    >
      {shownSections.map((section, index) => {
        const schedules = section.schedules || [];
        const instructors =
          section.instructors
            ?.map((instructor) => instructor.name)
            .join(", ") || "N/A";
        const baseOutlinePath = generateBaseOutlinePath(offering);

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

        return (
          <div
            key={offering.term + offering.dept + offering.number}
            className="section-container"
          >
            <div className="section-header">
              <div className="section-header__left">
                <span className="icon-text-container">
                  {notLabOrTut(section.schedules[0].sectionCode) ? (
                    <Link
                      className="no-underline"
                      href={`${baseOutlinePath}/${section.section.toLowerCase()}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {section.schedules[0].sectionCode} {section.section}
                    </Link>
                  ) : (
                    <>
                      {section.schedules[0].sectionCode} {section.section}
                    </>
                  )}
                </span>
                <span className="icon-text-container">
                  <BsFillPersonFill />
                  {section.instructors.length > 0
                    ? section.instructors
                        .map((i) => i.name)
                        .filter(onlyUnique)
                        .join(", ")
                    : "Unknown"}
                </span>
                <span className="icon-text-container">
                  {section.deliveryMethod}
                </span>
              </div>
              <span>#{section.classNumber}</span>
            </div>

            <div className="section-schedule-container">
              {section.schedules.map((sched) => (
                <div
                  key={sched.days + sched.startDate}
                  className="section-schedule-row"
                >
                  <span
                    className="icon-text-container"
                    style={{ minWidth: "6.75rem" }}
                  >
                    <CiCalendar />
                    {sched.days || "-"}
                  </span>
                  <span
                    className="icon-text-container"
                    style={{ minWidth: "8rem" }}
                  >
                    <CiClock1 />
                    {`${sched.startTime} - ${sched.endTime}`}
                  </span>
                  <span
                    className="icon-text-container mobile-hide"
                    style={{ minWidth: "2rem" }}
                  >
                    <FaTimeline />
                    {`${formatShortDate(sched.startDate)} - ${formatShortDate(
                      sched.endDate
                    )}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {hasLabTut && (
        <div
          className="toggle-row btn"
          onClick={() => setShowLabTut(!showLabTut)}
        >
          {showLabTut
            ? "Hide Lab/Tutorial Sections"
            : "Show Lab/Tutorial Sections"}
        </div>
      )}
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
      loadCourseAPIData(
        `/outlines/${courseCode.dept}/${courseCode.number}`,
        setCourse
      );
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
        title={`explore ${course.dept.toLowerCase()} ${course.number} @ sfu`}
        backgroundImage={HeroImage.src}
      />
      <main className="container course-container">
        <div className="course-top-container">
          <div className="course-page-card">
            <div className="course-title">
              {`${course.dept} ${course.number} - ${course.title} (${course.units})`}
            </div>
            <div className="course-page-card__connt">
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
          <div className="course-offerings">
            {isIdle ? (
              "Waiting for course data..."
            ) : error ? (
              `Error loading offerings: ${error.message}`
            ) : offerings.length === 0 ? (
              "No offerings available"
            ) : (
              <>
                <CourseTabContainer tabs={tabs} />
                <p className="gray-text right-align">
                  Last updated X hours ago -{" "}
                  <Link
                    href="https://api.sfucourses.com"
                    className="no-underline"
                  >
                    api.sfucourses.com
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
        <RedditPosts dept={course.dept} number={course.number} />{" "}
      </main>
    </div>
  );
};

export default CoursePage;
