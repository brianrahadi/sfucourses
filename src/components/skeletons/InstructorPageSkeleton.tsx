import React from "react";
import { BoneShell, BoneFile } from "../bones/BoneShell";
import headerCard from "src/bones/instructor-header-card.bones.json";
import charts from "src/bones/instructor-charts.bones.json";
import reviews from "src/bones/instructor-reviews.bones.json";
import offerings from "src/bones/instructor-offerings.bones.json";

/** The instructor page while it loads, using the page's own layout classes. */
export const InstructorPageSkeleton: React.FC = () => (
  <div className="page courses-page">
    <main className="container course-container">
      <div className="course-main-header">
        <BoneShell
          name="instructor-header-card"
          bones={headerCard as BoneFile}
          className="course-page-card"
          style={{ alignSelf: "stretch" }}
        />
        <BoneShell
          name="instructor-charts"
          bones={charts as BoneFile}
          className="course-charts-section"
        />
      </div>
      <div className="course-bottom-container">
        <BoneShell
          name="instructor-reviews"
          bones={reviews as BoneFile}
          className="course-bottom-left"
        />
        <BoneShell
          name="instructor-offerings"
          bones={offerings as BoneFile}
          className="course-bottom-right"
        />
      </div>
    </main>
  </div>
);

export default InstructorPageSkeleton;
