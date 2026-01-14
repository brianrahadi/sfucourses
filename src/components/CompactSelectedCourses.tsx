import React, { useMemo } from "react";
import { CourseWithSectionDetails, InstructorReviewSummary } from "@types";
import { getInstructorReviewData } from "@utils";
import { IoRemoveCircle } from "react-icons/io5";
import { BsFillPersonFill } from "react-icons/bs";
import { MdPlace } from "react-icons/md";
import { FaStar, FaBrain, FaComment, FaCheckCircle } from "react-icons/fa";
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "@const";

interface CompactSelectedCoursesProps {
  selectedCourses: CourseWithSectionDetails[];
  onRemoveCourse: (
    course: CourseWithSectionDetails,
    classNumber: string
  ) => void;
  term: string;
}

export const CompactSelectedCourses: React.FC<CompactSelectedCoursesProps> = ({
  selectedCourses,
  onRemoveCourse,
  term,
}) => {
  const { data: instructorReviewsData } = useQuery({
    queryKey: ["instructorReviews"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/reviews/instructors`);
      return res.json() as Promise<InstructorReviewSummary[]>;
    },
    staleTime: 60 * 60 * 1000,
  });

  const instructorTooltips = useMemo(() => {
    const tooltips = new Map<string, InstructorReviewSummary>();
    if (!instructorReviewsData) return tooltips;

    selectedCourses.forEach((course) => {
      course.sections.forEach((section) => {
        if (section.instructors.length > 0) {
          const instructorName = section.instructors[0].name;
          const instructorReviewData = getInstructorReviewData(
            instructorName,
            instructorReviewsData
          );

          if (instructorReviewData) {
            const instructorTooltipId = `instructor-tooltip-compact-${
              course.dept
            }-${course.number}-${section.classNumber}-${instructorName.replace(
              /\s+/g,
              "-"
            )}`;
            tooltips.set(instructorTooltipId, instructorReviewData);
          }
        }
      });
    });
    return tooltips;
  }, [selectedCourses, instructorReviewsData]);

  return (
    <div className="selected-courses">
      <h3 className="section-title">
        Selected Course - {term} (
        {selectedCourses.length > 0
          ? selectedCourses
              .map((c) => +c.units)
              .reduce((prev, curr) => curr + Number(prev))
          : 0}{" "}
        units)
      </h3>

      <div className="selected-courses__items">
        {selectedCourses.length > 0 ? (
          selectedCourses.map((course) => (
            <div
              key={`${course.dept}${course.number}`}
              className="compact-course-card"
            >
              <div className="compact-course-header">
                <Link
                  href={`/explore/${course.dept.toLowerCase()}-${
                    course.number
                  }`}
                  className="no-underline"
                  data-tooltip-id="new-tab-tooltip"
                  data-tooltip-content="New tab"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="course-code">
                    {course.dept} {course.number} - {course.title}
                    {course.units &&
                    course.units !== "0" &&
                    course.units !== "N/A"
                      ? ` (${course.units})`
                      : ""}
                  </span>
                </Link>
              </div>

              {course.sections.map((section) => (
                <div key={section.classNumber} className="compact-section-row">
                  <div className="compact-section-info">
                    <span className="section-code">{section.section}</span>
                    {/* <span className="class-number">#{section.classNumber}</span> */}

                    <div className="section-details">
                      <span className="instructor">
                        <BsFillPersonFill />
                        {section.instructors.length > 0
                          ? (() => {
                              const instructorName =
                                section.instructors[0].name;
                              const instructorReviewData =
                                getInstructorReviewData(
                                  instructorName,
                                  instructorReviewsData
                                );
                              const instructorTooltipId = `instructor-tooltip-compact-${
                                course.dept
                              }-${course.number}-${
                                section.classNumber
                              }-${instructorName.replace(/\s+/g, "-")}`;

                              return (
                                <Link
                                  href={`/instructors/${instructorName}`}
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
                                  {instructorName}
                                </Link>
                              );
                            })()
                          : "N/A"}
                      </span>
                      <span className="location">
                        <MdPlace />
                        {section.deliveryMethod !== "Online"
                          ? section.schedules[0]?.campus || "-"
                          : "Online"}
                      </span>
                    </div>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => onRemoveCourse(course, section.classNumber)}
                    aria-label="Remove course"
                  >
                    <IoRemoveCircle />
                  </button>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="gray-text empty-message">No selected courses yet</p>
        )}
      </div>
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
