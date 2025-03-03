import React, { useState, useEffect } from "react";
import { CourseOutline, CourseWithSectionDetails } from "@types";
import { getCourseAPIData } from "@utils";
import { toTermCode, formatShortDate } from "@utils/format";
import { getCurrentAndNextTerm } from "@utils";
import { BsFillPersonFill } from "react-icons/bs";
import { CiCalendar, CiClock1 } from "react-icons/ci";
import { MdPlace } from "react-icons/md";

interface CoursePopoverProps {
  course: CourseOutline;
  isVisible: boolean;
  position: { x: number; y: number };
}

export const CoursePopover: React.FC<CoursePopoverProps> = ({
  course,
  isVisible,
  position,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTermSections, setCurrentTermSections] =
    useState<CourseWithSectionDetails | null>(null);
  const [nextTermSections, setNextTermSections] =
    useState<CourseWithSectionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const terms = getCurrentAndNextTerm();
  const [currentTerm, nextTerm] = terms;

  useEffect(() => {
    // Only fetch data when the popover is visible
    if (!isVisible) return;

    const fetchSectionData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch current term sections
        const currentTermCode = toTermCode(currentTerm);
        const currentTermData = await getCourseAPIData(
          `/sections/${currentTermCode}/${course.dept.toLowerCase()}/${
            course.number
          }`
        );

        // Fetch next term sections
        const nextTermCode = toTermCode(nextTerm);
        const nextTermData = await getCourseAPIData(
          `/sections/${nextTermCode}/${course.dept.toLowerCase()}/${
            course.number
          }`
        );

        setCurrentTermSections(currentTermData);
        setNextTermSections(nextTermData);
      } catch (error) {
        console.error("Error fetching section data:", error);
        setError("No offerings for current term and next term");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectionData();
  }, [isVisible, course, currentTerm, nextTerm]);

  if (!isVisible) return null;

  // Calculate position styles to ensure popover stays within viewport
  const calculatePosition = () => {
    const margin = 10; // Margin from viewport edges
    const popoverWidth = 400; // Approximate width of popover
    const popoverHeight = 300; // Approximate height of popover
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = position.x;
    let top = position.y;

    // Adjust horizontal position if would overflow right edge
    if (left + popoverWidth + margin > viewportWidth) {
      left = Math.max(margin, viewportWidth - popoverWidth - margin);
    }

    // Adjust vertical position if would overflow bottom edge
    if (top + popoverHeight + margin > viewportHeight) {
      top = Math.max(margin, viewportHeight - popoverHeight - margin);
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  const renderSectionDetails = (
    sections: CourseWithSectionDetails | null,
    term: string
  ) => {
    if (!sections || sections.sections.length === 0) {
      return <p className="no-sections">No sections available for {term}</p>;
    }

    // Take the first 2 sections to show in preview
    const previewSections = sections.sections.slice(0, 2);

    return (
      <div className="term-sections">
        {previewSections.map((section) => (
          <div key={section.classNumber} className="section-preview">
            <div className="section-header">
              <span className="section-code">{section.section}</span>
              <span className="class-number">#{section.classNumber}</span>
            </div>

            <div className="section-details">
              <span className="instructor">
                <BsFillPersonFill />
                {section.instructors.length > 0
                  ? section.instructors[0].name
                  : "TBA"}
              </span>

              {section.schedules.length > 0 && (
                <>
                  <div className="schedule-info">
                    <span className="days">
                      <CiCalendar />
                      {section.schedules[0].days || "TBA"}
                    </span>
                    <span className="time">
                      <CiClock1 />
                      {section.schedules[0].startTime &&
                      section.schedules[0].endTime
                        ? `${section.schedules[0].startTime} - ${section.schedules[0].endTime}`
                        : "TBA"}
                    </span>
                  </div>
                  <span className="location">
                    <MdPlace />
                    {section.deliveryMethod === "Online"
                      ? "Online"
                      : section.schedules[0].campus || "TBA"}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}

        {sections.sections.length > 2 && (
          <div className="more-sections">
            +{sections.sections.length - 2} more sections
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="course-popover" style={calculatePosition()}>
      <div className="popover-header">
        <h3>
          {course.dept} {course.number} Sections
        </h3>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading section details...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : (
        <div className="popover-content">
          <div className="term-container">
            <h4>{currentTerm}</h4>
            {renderSectionDetails(currentTermSections, currentTerm)}
          </div>

          <div className="term-container">
            <h4>{nextTerm}</h4>
            {renderSectionDetails(nextTermSections, nextTerm)}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePopover;
