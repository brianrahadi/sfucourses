import React from "react";
import { Instructor } from "@types";
import { Highlight, TextBadge } from "@components";
import Link from "next/link";
import { termToIcon } from "@utils/exploreFilters";

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
        <div className="instructor-name-section">
          {query ? (
            <Highlight text={instructor.name} query={query} />
          ) : (
            <p>{instructor.name}</p>
          )}

          {/* Instructor Review Info as TextBadges */}
          {reviewData && (
            <div className="instructor-review-badges">
              <TextBadge
                className="review-badge"
                content={`Quality: ${reviewData.Quality}/5`}
              />
              <TextBadge
                className="review-badge"
                content={`Difficulty: ${reviewData.Difficulty}/5`}
              />
              <TextBadge
                className="review-badge"
                content={`Would Take Again: ${reviewData.WouldTakeAgain}`}
              />
              <TextBadge
                className="review-badge"
                content={`Ratings: ${reviewData.Ratings}`}
              />
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
