import React from "react";
import { Instructor } from "@types";
import { Highlight } from "@components";

type InstructorCardProps = {
  instructor: Instructor;
  query?: string;
};

export const InstructorCard: React.FC<InstructorCardProps> = ({
  instructor,
  query,
}) => {
  return (
    <div className="course-card">
      <div className="course-title dark">
        {query ? (
          <Highlight text={instructor.name} query={query} />
        ) : (
          <p>{instructor.name}</p>
        )}
      </div>
    </div>
  );
};
