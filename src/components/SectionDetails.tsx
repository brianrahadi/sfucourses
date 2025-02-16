import { CourseWithSectionDetails } from "@types";
import { formatShortDate, generateBaseOutlinePath, onlyUnique } from "@utils";
import Link from "next/link";
import { useState } from "react";
import { BsFillPersonFill } from "react-icons/bs";
import { CiCalendar, CiClock1 } from "react-icons/ci";
import { FaTimeline } from "react-icons/fa6";

export const SectionDetails: React.FC<{
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
              <span>Add section</span>
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
