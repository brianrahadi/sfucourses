import { Button, Highlight } from "@components";
import {
  CourseWithSectionDetails,
  SectionDetail,
  SectionSchedule,
  InstructorReviewSummary,
} from "@types";
import {
  generateBaseOutlinePath,
  onlyUnique,
  getInstructorReviewData,
} from "@utils";
import Link from "next/link";
import { Dispatch, SetStateAction, useState, useRef, useMemo } from "react";
import { BsFillPersonFill } from "react-icons/bs";
import { CiCalendar, CiClock1 } from "react-icons/ci";
import { FaTimeline } from "react-icons/fa6";
import { MdPlace } from "react-icons/md";
import {
  IoAddCircle,
  IoRemoveCircle,
  IoChevronUp,
  IoChevronDown,
} from "react-icons/io5";
import { FaStar, FaBrain, FaComment, FaCheckCircle } from "react-icons/fa";
import { formatShortDate } from "@utils/format";
import { Tooltip } from "react-tooltip";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "@const";

interface SectionDetailsProps {
  offering: CourseWithSectionDetails;
  setOfferings?: {
    fn: Dispatch<SetStateAction<CourseWithSectionDetails[]>>;
    type: "ADD" | "REMOVE";
  };
  type?: "SELECTED_COURSES";
  query?: string;
  previewCourse?: CourseWithSectionDetails | null;
  setPreviewCourse?: Dispatch<CourseWithSectionDetails | null>;
  showAllSections: boolean;
  onToggleShowAllSections: () => void;
  showLabTut: boolean;
  onToggleShowLabTut: () => void;
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
  previewCourse,
  setPreviewCourse,
  showAllSections,
  onToggleShowAllSections,
  showLabTut,
  onToggleShowLabTut,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: instructorReviewsData } = useQuery({
    queryKey: ["instructorReviews"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/reviews/instructors`);
      return res.json() as Promise<InstructorReviewSummary[]>;
    },
    staleTime: 60 * 60 * 1000,
  });

  const processedSections = processSectionDetails(offering.sections).filter(
    (section) => section.schedules && section.schedules.length > 0
  );

  const notLabOrTut = (sectionCode: string) =>
    sectionCode !== "LAB" && sectionCode !== "TUT" && sectionCode !== "OPL";

  const nonLabTutSections = processedSections.filter((section) =>
    section.schedules.every((sched) => notLabOrTut(sched.sectionCode))
  );

  const hasOnlyLabTut =
    nonLabTutSections.length === 0 && processedSections.length > 0;

  const initialShownSections = hasOnlyLabTut
    ? processedSections
    : type === "SELECTED_COURSES" || processedSections.length === 1
    ? processedSections
    : nonLabTutSections;

  const hasLabTut =
    processedSections.length > nonLabTutSections.length && !hasOnlyLabTut;

  const shownSections = showLabTut
    ? processedSections
    : showAllSections
    ? processedSections
    : initialShownSections.slice(0, 2);

  const instructorTooltips = useMemo(() => {
    const tooltips = new Map<string, InstructorReviewSummary>();
    if (!instructorReviewsData) return tooltips;

    shownSections.forEach((section) => {
      const instructorsText =
        section.instructors.length > 0
          ? section.instructors
              .map((i) => i.name)
              .filter(onlyUnique)
              .join(", ")
          : "N/A";
      const firstInstructorName =
        instructorsText !== "N/A" ? instructorsText.split(", ")[0] : null;

      if (firstInstructorName) {
        const instructorReviewData = getInstructorReviewData(
          firstInstructorName,
          instructorReviewsData
        );

        if (instructorReviewData) {
          const instructorTooltipId = `instructor-tooltip-${
            section.classNumber
          }-${firstInstructorName.replace(/\s+/g, "-")}`;
          tooltips.set(instructorTooltipId, instructorReviewData);
        }
      }
    });
    return tooltips;
  }, [shownSections, instructorReviewsData]);

  return (
    <div
      key={"s" + offering.term + offering.dept + offering.number}
      className={`offering ${
        type === "SELECTED_COURSES" ? "selected-courses-offering" : ""
      }`}
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
            : "N/A";

        const firstInstructorName =
          instructorsText !== "N/A" ? instructorsText.split(", ")[0] : null;
        const instructorReviewData = firstInstructorName
          ? getInstructorReviewData(firstInstructorName, instructorReviewsData)
          : null;

        const instructorTooltipId = `instructor-tooltip-${
          section.classNumber
        }-${firstInstructorName?.replace(/\s+/g, "-") || "na"}`;

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
          <div
            key={section.classNumber}
            className={`section-container ${
              type === "SELECTED_COURSES" ? "selected-course-section" : ""
            }`}
          >
            <div className="section-header">
              <div className="section-header__first">
                <span className="icon-text-container">
                  {notLabOrTut(section.schedules[0]?.sectionCode) ? (
                    <Link
                      className="no-underline"
                      href={`${baseOutlinePath}/${section.section.toLowerCase()}`}
                      target="_blank"
                      rel="noreferrer"
                      data-tooltip-id="new-tab-tooltip"
                      data-tooltip-content="New tab"
                    >
                      {section.schedules[0]?.sectionCode} {section.section}
                    </Link>
                  ) : (
                    <>
                      {section.schedules[0]?.sectionCode} {section.section}
                    </>
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
                    onMouseDown={handleAddSection}
                    onMouseEnter={() => {
                      if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                      }
                      if (
                        previewCourse &&
                        previewCourse.dept + previewCourse.number ===
                          courseWithSection.dept + courseWithSection.number
                      ) {
                        return;
                      }
                      setPreviewCourse?.(courseWithSection);
                    }}
                    onMouseLeave={() => {
                      timeoutRef.current = setTimeout(() => {
                        setPreviewCourse?.(null);
                      }, 100);
                    }}
                  />
                ) : (
                  <span>#{section.classNumber}</span>
                )}
              </div>
              <div className="section-header__second">
                <span className="icon-text-container instructor">
                  <BsFillPersonFill />
                  {instructorsText !== "N/A" && query ? (
                    <Link
                      href={`/instructors/${instructorsText}`}
                      className="no-underline"
                      target="_blank"
                      rel="noreferrer"
                      data-tooltip-id={
                        instructorReviewData
                          ? instructorTooltipId
                          : "new-tab-tooltip"
                      }
                      data-tooltip-content={
                        instructorReviewData ? undefined : "New tab"
                      }
                    >
                      <Highlight
                        text={instructorsText}
                        query={query}
                        className="green-text"
                      />
                    </Link>
                  ) : instructorsText !== "N/A" ? (
                    <Link
                      href={`/instructors/${instructorsText}`}
                      className="no-underline"
                      target="_blank"
                      rel="noreferrer"
                      data-tooltip-id={
                        instructorReviewData
                          ? instructorTooltipId
                          : "new-tab-tooltip"
                      }
                      data-tooltip-content={
                        instructorReviewData ? undefined : "New tab"
                      }
                    >
                      {instructorsText}
                    </Link>
                  ) : (
                    "N/A"
                  )}
                </span>
                <span className="icon-text-container">
                  <MdPlace />
                  {section.deliveryMethod !== "Online"
                    ? section.schedules[0].campus || "-"
                    : "Online"}
                </span>
              </div>
            </div>

            {/* Only show schedule details for non-selected courses */}
            {type !== "SELECTED_COURSES" && (
              <div className="section-schedule-container">
                {section.schedules.map((sched) => (
                  <div
                    key={
                      sched.days +
                      sched.startDate +
                      sched.startTime +
                      sched.sectionCode
                    }
                    className="section-schedule-row"
                  >
                    <span
                      className="icon-text-container"
                      style={{ minWidth: "3rem" }}
                    >
                      <CiCalendar />
                      {sched.days || "-"}
                    </span>
                    <span
                      className="icon-text-container"
                      style={{ minWidth: "7.5rem" }}
                    >
                      <CiClock1 />
                      {`${sched.startTime} - ${sched.endTime}`}
                    </span>
                    <span
                      className="icon-text-container"
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
            )}
          </div>
        );
      })}
      {(hasOnlyLabTut && processedSections.length > 2) ||
        (!hasLabTut && initialShownSections.length > 2 && (
          <button
            className="toggle-row btn"
            onClick={() => onToggleShowAllSections()}
          >
            {showAllSections ? (
              <>
                <IoChevronUp /> Show Less Sections
              </>
            ) : (
              <>
                <IoChevronDown /> Show More Sections
              </>
            )}
          </button>
        ))}
      {hasLabTut && (
        <button className="toggle-row btn" onClick={() => onToggleShowLabTut()}>
          {showLabTut ? (
            <>
              <IoChevronUp /> Hide Lab/Tutorial Sections
            </>
          ) : (
            <>
              <IoChevronDown /> Show Lab/Tutorial Sections
            </>
          )}
        </button>
      )}
      <Tooltip id="new-tab-tooltip" place="top" />
      {Array.from(instructorTooltips.entries()).map(
        ([tooltipId, reviewData]) => (
          <Tooltip key={tooltipId} id={tooltipId} place="top">
            <div className="instructor-stats-tooltip">
              <div className="instructor-stats-tooltip__stat">
                <FaStar className="instructor-stats-tooltip__icon instructor-stats-tooltip__icon--star" />
                <span>{reviewData.Quality}</span>
              </div>
              <div className="instructor-stats-tooltip__stat">
                <FaBrain className="instructor-stats-tooltip__icon instructor-stats-tooltip__icon--brain" />
                <span>{reviewData.Difficulty}</span>
              </div>
              <div className="instructor-stats-tooltip__stat">
                <FaCheckCircle className="instructor-stats-tooltip__icon instructor-stats-tooltip__icon--check" />
                <span>{reviewData.WouldTakeAgain}</span>
              </div>
              <div className="instructor-stats-tooltip__stat">
                <FaComment className="instructor-stats-tooltip__icon instructor-stats-tooltip__icon--comment" />
                <span>{reviewData.Ratings}</span>
              </div>
            </div>
          </Tooltip>
        )
      )}
    </div>
  );
};
