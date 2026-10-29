import React from "react";
import { CourseOutline } from "@types";
import { BoneShell, BoneFile } from "../bones/BoneShell";
import { CourseHeaderCard, CoursePrerequisites } from "../CourseSections";
import headerCard from "src/bones/course-header-card.bones.json";
import charts from "src/bones/course-charts.bones.json";
import reviews from "src/bones/course-reviews.bones.json";
import prereqs from "src/bones/course-prereqs.bones.json";
import offerings from "src/bones/course-offerings.bones.json";

/**
 * The course page while it loads, built from the page's own layout classes
 * so every region lands exactly where its content will appear.
 */
export const CoursePageSkeleton: React.FC<{
  /** Already-known outline (e.g. cached from /explore), shown immediately. */
  course?: CourseOutline;
  totalReviews?: number | null;
}> = ({ course, totalReviews }) => (
  <div className="page courses-page">
    <main className="container course-container">
      <div className="course-main-header">
        {course ? (
          <CourseHeaderCard course={course} totalReviews={totalReviews} />
        ) : (
          <BoneShell
            name="course-header-card"
            bones={headerCard as BoneFile}
            className="course-page-card"
          />
        )}
        {/* Courses without reviews have no charts; assume charts unless known. */}
        {totalReviews !== 0 && (
          <BoneShell
            name="course-charts"
            bones={charts as BoneFile}
            className="course-charts-section"
          />
        )}
      </div>
      <div className="course-bottom-container">
        <BoneShell
          name="course-reviews"
          bones={reviews as BoneFile}
          className="course-bottom-left"
        />
        <div className="course-bottom-right">
          {course ? (
            <CoursePrerequisites course={course} />
          ) : (
            <BoneShell
              name="course-prereqs"
              bones={prereqs as BoneFile}
              className="prerequisites-section"
            />
          )}
          <BoneShell
            name="course-offerings"
            bones={offerings as BoneFile}
            className="course-offerings"
          />
        </div>
      </div>
    </main>
  </div>
);

export default CoursePageSkeleton;
