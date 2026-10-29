import React from "react";
import { BoneShell, BoneFile } from "../bones/BoneShell";
import courseCard from "src/bones/explore-course-card.bones.json";
import instructorCard from "src/bones/explore-instructor-card.bones.json";

/** Placeholder cards for the /explore list while its data loads. */
export const ExploreCardsSkeleton: React.FC<{
  mode: "courses" | "instructors";
  count?: number;
}> = ({ mode, count = 6 }) => (
  <>
    {Array.from({ length: count }, (_, i) =>
      mode === "courses" ? (
        <BoneShell
          key={i}
          name="explore-course-card"
          bones={courseCard as BoneFile}
          className="course-card"
        />
      ) : (
        <BoneShell
          key={i}
          name="explore-instructor-card"
          bones={instructorCard as BoneFile}
          className="course-card instructor-card"
        />
      )
    )}
  </>
);
