import React from "react";
import Link from "next/link";
import { CourseOutline } from "../types";
import { Highlight } from "@components";
import { termToIcon } from "@utils/exploreFilters";
import { FaStar, FaBrain, FaComment } from "react-icons/fa";

interface CourseReviewSummary {
  course_code: string;
  total_reviews: number;
  avg_rating: number;
  avg_difficulty: number;
}

type ExploreCourseCardProps = {
  course: CourseOutline;
  query?: string;
  showPrereqs?: boolean;
  prereqsQuery?: string;
  showInstructors?: boolean;
  showDescription?: boolean;
  isLink?: boolean;
  reviewData?: CourseReviewSummary;
};

export const ExploreCourseCard: React.FC<ExploreCourseCardProps> = ({
  course,
  query,
  prereqsQuery,
  showPrereqs = false,
  showInstructors = false,
  showDescription = true,
  isLink = true,
  reviewData,
}) => {
  const courseDescriptionShortened =
    showDescription && course.description && course.description.length > 400
      ? course.description.slice(0, 400) + " ..."
      : course.description || "";

  const header = `${course.dept} ${course.number} - ${course.title}${
    course.units && course.units !== "0" && course.units !== "N/A"
      ? ` (${course.units})`
      : ""
  }`;

  const CardContent = () => (
    <>
      <div className="course-title">
        <div className="course-title-content">
          {query ? <Highlight text={header} query={query} /> : <p>{header}</p>}
          {reviewData && (
            <div className="course-review-stats">
              <span className="course-review-stat">
                <FaStar className="course-review-icon course-review-icon--star" />
                {reviewData.avg_rating.toFixed(1)}
              </span>
              <span className="course-review-stat">
                <FaBrain className="course-review-icon course-review-icon--brain" />
                {reviewData.avg_difficulty.toFixed(1)}
              </span>
              <span className="course-review-stat">
                <FaComment className="course-review-icon course-review-icon--comment" />
                {reviewData.total_reviews}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="course-card__content">
        {showDescription &&
          (query ? (
            <Highlight
              text={courseDescriptionShortened}
              query={query}
              className="course-description"
            />
          ) : (
            <p className="course-description">
              {courseDescriptionShortened}
              {course.designation && course.designation != "N/A"
                ? " " + course.designation
                : ""}
            </p>
          ))}
        {showPrereqs && !prereqsQuery && course.prerequisites ? (
          <p className="course-description">
            Prerequisite: {course.prerequisites || "N/A"}
          </p>
        ) : prereqsQuery && course.prerequisites ? (
          <Highlight
            initialText="Prerequisites: "
            text={course.prerequisites}
            query={prereqsQuery}
            className="course-description"
          />
        ) : null}
        <div className="course-card__row">
          {showInstructors &&
            course.offerings &&
            course.offerings
              .filter((offering: any) => offering.instructors.length !== 0)
              .map((offering: any) => {
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
                    &thinsp;
                    {query ? (
                      <Highlight text={text} query={query} />
                    ) : (
                      <p>{text}</p>
                    )}
                  </div>
                );
              })}
        </div>
      </div>
    </>
  );

  if (isLink) {
    return (
      <Link
        href={`/explore/${course.dept.toLowerCase()}-${course.number}`}
        key={course.dept + course.number}
        className="course-card is-link"
      >
        <CardContent />
      </Link>
    );
  }

  return (
    <div className="course-card">
      <CardContent />
    </div>
  );
};
