import React from "react";
import { CourseOutline } from "@types";

/**
 * Pieces of the course page that only need the course outline. They are
 * shared with the loading skeleton, which can show them right away when the
 * outline is already cached (e.g. when opening a course from /explore).
 */

export const CourseHeaderCard: React.FC<{
  course: CourseOutline;
  totalReviews?: number | null;
}> = ({ course, totalReviews }) => (
  <div className="course-page-card">
    <div className="course-header-row">
      <span className="course-code-title">
        {course.dept} {course.number}
      </span>
      {course.units && course.units !== "0" && course.units !== "N/A" && (
        <span className="course-credits">{course.units} Credits</span>
      )}
    </div>
    <div className="course-title">{course.title}</div>
    <div className="course-page-card__connt">
      <p className="course-description">
        {course.description}
        {course.designation && course.designation != "N/A"
          ? " " + course.designation
          : ""}
      </p>
      {totalReviews != null && (
        <p className="course-reviews-count">{totalReviews} reviews</p>
      )}
    </div>
  </div>
);

export const CoursePrerequisites: React.FC<{
  course: CourseOutline;
  showVisualization?: boolean;
  onToggleVisualization?: () => void;
}> = ({ course, showVisualization = false, onToggleVisualization }) => (
  <div className="prerequisites-section">
    <div className="prereq-header">
      {!showVisualization ? <h2>Prerequisites</h2> : <div></div>}
      <button
        className="prereq-toggle-btn"
        onClick={onToggleVisualization}
        aria-label="Toggle prerequisites visualization"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12V7H5a2 2 0 0 1-2-2V3" />
          <path d="M21 12H13a2 2 0 0 0-2 2v2" />
          <circle cx="21" cy="12" r="2" />
          <circle cx="21" cy="7" r="2" />
          <circle cx="11" cy="16" r="2" />
        </svg>
      </button>
    </div>

    {showVisualization ? (
      <iframe
        src={`https://prerequisites-visualization.vercel.app/sfu/courses/${course.dept.toLowerCase()}/${course.number.toLowerCase()}`}
        style={{
          width: "100%",
          height: "350px",
          border: "none",
          borderRadius: "8px",
        }}
        title="Prerequisites Visualization"
      ></iframe>
    ) : (
      <div className="prereq-content">
        <p className="prereq-text">
          {course.prerequisites || "This course has no prerequisites."}
        </p>

        {course.corequisites && (
          <>
            <h2 className="coreq-heading">Corequisites</h2>
            <p className="prereq-text">{course.corequisites || "None"}</p>
          </>
        )}
      </div>
    )}
  </div>
);
