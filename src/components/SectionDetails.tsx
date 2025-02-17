import { Button } from "@components";
import { CourseWithSectionDetails } from "@types";
import { formatShortDate, generateBaseOutlinePath, onlyUnique } from "@utils";
import Link from "next/link";
import { Dispatch, SetStateAction, useState } from "react";
import { BsFillPersonFill } from "react-icons/bs";
import { CiCalendar, CiClock1 } from "react-icons/ci";
import { FaTimeline } from "react-icons/fa6";
import { IoAddCircle, IoRemoveCircle } from "react-icons/io5";
import { PlusCircle } from "react-feather";

interface SectionDetailsProps {
  offering: CourseWithSectionDetails;
  setOfferings?: {
    fn: Dispatch<SetStateAction<CourseWithSectionDetails[]>>;
    type: "ADD" | "REMOVE";
  };
  type?: "SELECTED_COURSES";
}

export const SectionDetails: React.FC<SectionDetailsProps> = ({
  offering,
  setOfferings,
  type,
}) => {
  const [showLabTut, setShowLabTut] = useState(false);
  const notLabOrTut = (sectionCode: string) =>
    sectionCode !== "LAB" && sectionCode !== "TUT";
  const initialShownSections =
    type === "SELECTED_COURSES"
      ? offering.sections
      : offering.sections.filter((section) =>
          section.schedules.every((sched) => notLabOrTut(sched.sectionCode))
        );

  const hasLabTut =
    offering.sections.length > 1 &&
    offering.sections.length !== initialShownSections.length;
  const shownSections = showLabTut ? offering.sections : initialShownSections;

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

        const handleAddSection = () => {
          if (!setOfferings) return;
          if (setOfferings.type === "ADD") {
            setOfferings.fn((prev) => {
              // Check if any section of the course already exists in the previous state
              const hasExistingSection = prev
                .flatMap((course) => course.sections)
                .includes(courseWithSection.sections[0]);

              if (hasExistingSection) {
                return prev; // If the section already exists, return the previous state
              }

              // Check if the course (by dept + number) already exists in the previous state
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

              // If the course doesn't exist, add it to the previous state
              return [...prev, courseWithSection];
            });
          } else {
            // Handle "REMOVE" case
            setOfferings.fn((prev) => {
              return prev
                .flatMap((course) => {
                  // If this isn't the course we're looking for, return it unchanged
                  if (
                    course.dept + course.number !==
                    offering.dept + offering.number
                  ) {
                    return course;
                  }

                  // Filter out the section to remove
                  const updatedSections = course.sections.filter(
                    (section) =>
                      section.classNumber !==
                      courseWithSection.sections[0].classNumber
                  );

                  // If there are no sections left, don't include this course
                  if (updatedSections.length === 0) {
                    return [];
                  }

                  // Return the course with updated sections
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
          <div key={section.classNumber} className="section-container">
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

            <div className="section-schedule-container">
              {section.schedules.map((sched) => (
                <div
                  key={"w" + sched.days + sched.startDate}
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
