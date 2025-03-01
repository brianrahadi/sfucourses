import { Button, Highlight } from "@components";
import {
  CourseWithSectionDetails,
  SectionDetail,
  SectionSchedule,
} from "@types";
import { generateBaseOutlinePath, onlyUnique } from "@utils";
import Link from "next/link";
import { Dispatch, SetStateAction, useState } from "react";
import { BsFillPersonFill } from "react-icons/bs";
import { CiCalendar, CiClock1 } from "react-icons/ci";
import { FaTimeline } from "react-icons/fa6";
import { MdPlace } from "react-icons/md";
import { IoAddCircle, IoRemoveCircle } from "react-icons/io5";
import { formatShortDate } from "@utils/format";

interface SectionDetailsProps {
  offering: CourseWithSectionDetails;
  setOfferings?: {
    fn: Dispatch<SetStateAction<CourseWithSectionDetails[]>>;
    type: "ADD" | "REMOVE";
  };
  type?: "SELECTED_COURSES";
  query?: string;
}

const processSchedules = (schedules: SectionSchedule[]): SectionSchedule[] =>
  schedules.flatMap((schedule) =>
    schedule.days.split(", ").map((day) => ({
      ...schedule,
      days: day,
    }))
  );

const processSectionDetails = (
  sectionDetails: SectionDetail[]
): SectionDetail[] =>
  sectionDetails.map((sectionDetail) => ({
    ...sectionDetail,
    schedules: processSchedules(sectionDetail.schedules),
  }));

export const SectionDetails: React.FC<SectionDetailsProps> = ({
  offering,
  setOfferings,
  type,
  query,
}) => {
  const processedSections = processSectionDetails(offering.sections);
  const [showLabTut, setShowLabTut] = useState(false);
  const notLabOrTut = (sectionCode: string) =>
    sectionCode !== "LAB" && sectionCode !== "TUT" && sectionCode !== "OPL";
  const initialShownSections =
    type === "SELECTED_COURSES"
      ? processedSections
      : processedSections.filter((section) =>
          section.schedules.every((sched) => notLabOrTut(sched.sectionCode))
        );

  const hasLabTut =
    processedSections.length > 1 &&
    processedSections.length !== initialShownSections.length;
  const shownSections = showLabTut ? processedSections : initialShownSections;

  return (
    <div
      key={"s" + offering.term + offering.dept + offering.number}
      className="offering"
    >
      {shownSections.map((section, index) => {
        const schedules = section.schedules || [];
        const instructors =
          section.instructors
            ?.map((instructor) => instructor.name)
            .join(", ") || "N/A";
        const baseOutlinePath = generateBaseOutlinePath(offering);

        const courseWithSection = { ...offering };
        courseWithSection.sections = courseWithSection.sections.filter(
          (item) => item.classNumber === section.classNumber
        );

        const instructorsText =
          section.instructors.length > 0
            ? section.instructors
                .map((i) => i.name)
                .filter(onlyUnique)
                .join(", ")
            : "Unknown";

        const handleAddSection = () => {
          if (!setOfferings) return;
          if (setOfferings.type === "ADD") {
            setOfferings.fn((prev) => {
              const hasExistingSection = prev
                .flatMap((course) => course.sections)
                .includes(courseWithSection.sections[0]);

              if (hasExistingSection) {
                return prev;
              }

              const existingCourseIndex = prev.findIndex(
                (course) =>
                  course.dept + course.number ===
                  courseWithSection.dept + courseWithSection.number
              );

              if (existingCourseIndex !== -1) {
                // If the course exists, merge the sections
                const updatedCourses = [...prev];
                updatedCourses[existingCourseIndex] = {
                  ...updatedCourses[existingCourseIndex],
                  sections: [
                    ...updatedCourses[existingCourseIndex].sections,
                    ...courseWithSection.sections,
                  ],
                };
                return updatedCourses;
              }

              return [...prev, courseWithSection];
            });
          } else {
            setOfferings.fn((prev) => {
              return prev
                .flatMap((course) => {
                  if (
                    course.dept + course.number !==
                    offering.dept + offering.number
                  ) {
                    return course;
                  }

                  const updatedSections = course.sections.filter(
                    (section) =>
                      section.classNumber !==
                      courseWithSection.sections[0].classNumber
                  );

                  if (updatedSections.length === 0) {
                    return [];
                  }

                  return {
                    ...course,
                    sections: updatedSections,
                  };
                })
                .filter(Boolean); // Remove any null entries (courses with no sections)
            });
          }
        };
        if (schedules.length === 0) {
          return <></>;
        }

        return (
          <div key={section.classNumber} className="section-container">
            <div className="section-header">
              <div className="section-header__first">
                <span className="icon-text-container">
                  {notLabOrTut(section.schedules[0]?.sectionCode) ? (
                    <Link
                      className="no-underline"
                      href={`${baseOutlinePath}/${section.section.toLowerCase()}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {section.schedules[0]?.sectionCode} {section.section}
                    </Link>
                  ) : (
                    <>{section.section}</>
                  )}
                </span>
                {setOfferings ? (
                  <Button
                    className="section-btn"
                    icon={
                      setOfferings.type === "ADD" ? (
                        <IoAddCircle />
                      ) : (
                        <IoRemoveCircle />
                      )
                    }
                    label={`#${section.classNumber}`}
                    onClick={handleAddSection}
                  />
                ) : (
                  <span>#{section.classNumber}</span>
                )}
              </div>
              <div className="section-header__second">
                <span className="icon-text-container instructor">
                  <BsFillPersonFill />
                  {query ? (
                    <Highlight text={instructorsText} query={query} />
                  ) : (
                    <p>{instructorsText}</p>
                  )}
                </span>
                <span className="icon-text-container">
                  <MdPlace />
                  {section.deliveryMethod !== "Online"
                    ? section.schedules[0].campus || "-"
                    : "Online"}
                  {/* {`${section.deliveryMethod} - ${section.schedules[0].campus}`} */}
                </span>
              </div>
            </div>

            <div className="section-schedule-container">
              {section.schedules.map((sched) => (
                <div
                  key={"w" + sched.days + sched.startDate}
                  className="section-schedule-row"
                >
                  <span
                    className="icon-text-container"
                    style={{ minWidth: "3rem" }} // hard-coded min width for same width
                  >
                    <CiCalendar />
                    {sched.days || "-"}
                  </span>
                  <span
                    className="icon-text-container"
                    style={{ minWidth: "6.5rem" }}
                  >
                    <CiClock1 />
                    {`${sched.startTime} - ${sched.endTime}`}
                  </span>
                  <span
                    className="icon-text-container"
                    // style={{ minWidth: "2rem" }}
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
