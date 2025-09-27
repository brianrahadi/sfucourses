import React, { Dispatch, SetStateAction, useState } from "react";
import {
  CourseOffering,
  CourseOutlineWithSectionDetails,
  CourseWithSectionDetails,
} from "../types";
import { Highlight, SectionDetails } from "@components";

type ScheduleCourseCardProps = {
  course: CourseWithSectionDetails;
  query?: string;
  sectionDetails: CourseWithSectionDetails;
  showDescription?: boolean;
  showInstructors?: boolean;
  isLink?: boolean;
  setOfferings?: {
    fn: Dispatch<SetStateAction<CourseWithSectionDetails[]>>;
    type: "ADD" | "REMOVE";
  };
  setPreviewCourse?: Dispatch<CourseWithSectionDetails | null>;
  onCourseHover?: (course: CourseWithSectionDetails | null) => void;
  onCourseClick?: (course: CourseWithSectionDetails) => void;
  setCourseDetails?: (course: CourseWithSectionDetails) => void;
};

export const ScheduleCourseCard: React.FC<ScheduleCourseCardProps> = ({
  course,
  query,
  sectionDetails,
  showDescription = true,
  showInstructors = false, // Add default value
  isLink = false,
  setOfferings,
  setPreviewCourse,
  onCourseHover,
  onCourseClick,
  setCourseDetails,
}) => {
  const [showAllSections, setShowAllSections] = useState(false);
  const [showLabTut, setShowLabTut] = useState(false);

  const handleCourseClick = (courseData: CourseWithSectionDetails) => {
    setCourseDetails?.(courseData);
  };

  const header = `${course.dept} ${course.number} - ${course.title}${
    course.units && course.units !== "0" && course.units !== "N/A"
      ? ` (${course.units})`
      : ""
  }`;

  const CardContent = () => (
    <>
      <div
        className="course-title"
        onClick={() => handleCourseClick(course)}
        style={{ cursor: setCourseDetails ? "pointer" : "default" }}
      >
        {query ? (
          <Highlight text={header} query={query} className="green-text" />
        ) : (
          <p className="green-text">{header}</p>
        )}
      </div>
      <div className="course-card__content">
        <div className="course-card__row">
          <SectionDetails
            offering={sectionDetails}
            setOfferings={setOfferings}
            query={query}
            setPreviewCourse={setPreviewCourse}
            showAllSections={showAllSections}
            onToggleShowAllSections={() => setShowAllSections((v) => !v)}
            showLabTut={showLabTut}
            onToggleShowLabTut={() => setShowLabTut((v) => !v)}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="course-card">
      <CardContent />
    </div>
  );
};
