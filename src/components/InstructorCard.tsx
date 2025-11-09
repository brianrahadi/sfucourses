import React from "react";
import { Instructor } from "@types";
import { Highlight } from "@components";
import Link from "next/link";
import { termToIcon } from "@utils/exploreFilters";
import { FaStar, FaBrain, FaComment, FaCheckCircle } from "react-icons/fa";

interface InstructorReviewSummary {
  URL: string;
  Quality: string;
  Ratings: string;
  Name: string;
  WouldTakeAgain: string;
  Difficulty: string;
  Department: string;
}

type InstructorCardProps = {
  instructor: Instructor;
  query?: string;
  isLink?: boolean;
  reviewData?: InstructorReviewSummary | null;
};

export const InstructorCard: React.FC<InstructorCardProps> = ({
  instructor,
  query,
  isLink = false,
  reviewData,
}) => {
  const InstructorCardContent = () => (
    <>
      <div className="course-title dark instructor-header">
        <div className="course-title-content">
          <div className="instructor-name-section">
            {query ? (
              <Highlight text={instructor.name} query={query} />
            ) : (
              <p>{instructor.name}</p>
            )}
          </div>
          {/* Instructor Review Info */}
          {reviewData && (
            <div className="course-review-stats">
              <span className="course-review-stat">
                <FaStar className="course-review-icon course-review-icon--star" />
                {reviewData.Quality}
              </span>
              <span className="course-review-stat">
                <FaBrain className="course-review-icon course-review-icon--brain" />
                {reviewData.Difficulty}
              </span>
              <span className="course-review-stat">
                <FaCheckCircle className="course-review-icon course-review-icon--check" />
                {reviewData.WouldTakeAgain}
              </span>
              <span className="course-review-stat">
                <FaComment className="course-review-icon course-review-icon--comment" />
                {reviewData.Ratings}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="course-card__row">
        {instructor.offerings &&
          instructor.offerings.length &&
          instructor.offerings
            .filter(
              (offering) =>
                // TODO: Refactor to be automated last 4 terms
                offering.term.includes("2025") ||
                offering.term.includes("Fall 2024")
            )
            .map((offering) => {
              const text = `${offering.dept} ${offering.number}`;
              return (
                <div className="text-badge" key={text}>
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
    </>
  );

  if (isLink) {
    return (
      <Link
        href={`/instructors/${instructor.name}`}
        className="course-card instructor-card"
      >
        <InstructorCardContent />
      </Link>
    );
  }

  return (
    <div className="course-card instructor-card">
      <InstructorCardContent />
    </div>
  );
};
