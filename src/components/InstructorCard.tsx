import React from "react";
import { Instructor } from "@types";
import { Highlight } from "@components";
import Link from "next/link";
import { termToIcon } from "./ExploreFilter";

type InstructorCardProps = {
  instructor: Instructor;
  query?: string;
  isLink?: boolean;
};

export const InstructorCard: React.FC<InstructorCardProps> = ({
  instructor,
  query,
  isLink = false,
}) => {
  const InstructorCardContent = () => (
    <div className="course-title dark">
      {query ? (
        <Highlight text={instructor.name} query={query} />
      ) : (
        <p>{instructor.name}</p>
      )}
      <br />
      <div className="course-card__row">
        {instructor.offerings.length &&
          instructor.offerings
            .filter(
              (offering) =>
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
    </div>
  );

  if (isLink) {
    return (
      <Link href={`/instructors/${instructor.name}}`} className="course-card">
        <InstructorCardContent />
      </Link>
    );
  }

  return (
    <div className="course-card">
      <InstructorCardContent />
    </div>
  );
};
