import React, { useState, useEffect, useMemo } from "react";
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
  position: { x: number; y: number; width?: number; height?: number };
}

// Popover placement options
type PopoverPlacement = "up" | "right" | "down" | "left";

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
  const [placement, setPlacement] = useState<PopoverPlacement>("right");

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
        setError("Failed to load section details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSectionData();
  }, [isVisible, course, currentTerm, nextTerm]);

  useEffect(() => {
    if (!isVisible) return;

    // Determine the best placement based on cursor position
    // Only calculate placement when popover becomes visible or window resizes
    // NOT when position updates slightly (prevents flickering)
    determinePlacement();

    // Add window resize listener to adjust placement if needed
    window.addEventListener("resize", determinePlacement);

    return () => {
      window.removeEventListener("resize", determinePlacement);
    };
  }, [isVisible]); // Dependency on isVisible only, not on position to prevent flickering

  // Determine the optimal placement for the popover
  const determinePlacement = () => {
    if (!position) return;

    const margin = 16; // Margin from elements and viewport edges
    const popoverWidth = 380; // Approximate width of popover
    const popoverHeight = 400; // Approximate height of popover

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const cursorX = position.x;
    const cursorY = position.y;

    // Calculate available space in each direction
    const spaceAbove = cursorY;
    const spaceBelow = viewportHeight - cursorY;
    const spaceToRight = viewportWidth - cursorX;
    const spaceToLeft = cursorX;

    // Check each direction with our priority: up, right, left, down

    // Check if there's enough room above
    if (spaceAbove >= popoverHeight + margin) {
      setPlacement("up");
      return;
    }

    // Check if there's enough room to the right
    if (spaceToRight >= popoverWidth + margin) {
      setPlacement("right");
      return;
    }

    // Check if there's enough room to the left
    if (spaceToLeft >= popoverWidth + margin) {
      setPlacement("left");
      return;
    }

    // Default to below if no other option works well
    setPlacement("down");
  };

  // Use useMemo correctly - outside of the render method
  const positionStyles = useMemo(() => {
    const margin = 16;
    const popoverWidth = 380;
    const popoverHeight = 400;

    let left = 0;
    let top = 0;

    switch (placement) {
      case "up":
        left = Math.max(
          margin,
          Math.min(
            window.innerWidth - popoverWidth - margin,
            position.x - popoverWidth / 2
          )
        );
        top = position.y - popoverHeight - margin;
        break;
      case "right":
        left = position.x + margin;
        top = Math.max(
          margin,
          Math.min(
            window.innerHeight - popoverHeight - margin,
            position.y - popoverHeight / 2
          )
        );
        break;
      case "left":
        left = position.x - popoverWidth - margin;
        top = Math.max(
          margin,
          Math.min(
            window.innerHeight - popoverHeight - margin,
            position.y - popoverHeight / 2
          )
        );
        break;
      case "down":
        left = Math.max(
          margin,
          Math.min(
            window.innerWidth - popoverWidth - margin,
            position.x - popoverWidth / 2
          )
        );
        top = position.y + margin;
        break;
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
      arrowClass: `arrow-${placement}`,
    };
  }, [placement, position.x, position.y]);

  if (!isVisible) return null;

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
          <div key={section.classNumber} className="section-container">
            <div className="section-header">
              <div className="section-header__first">
                <span className="icon-text-container">{section.section}</span>
                <span>#{section.classNumber}</span>
              </div>

              <div className="section-header__second">
                <span className="icon-text-container instructor">
                  <BsFillPersonFill />
                  <p>
                    {section.instructors.length > 0
                      ? section.instructors[0].name
                      : "TBA"}
                  </p>
                </span>

                <span className="icon-text-container">
                  <MdPlace />
                  {section.deliveryMethod === "Online"
                    ? "Online"
                    : section.schedules[0]?.campus || "TBA"}
                </span>
              </div>
            </div>

            {section.schedules.length > 0 && (
              <div className="section-schedule-container">
                {section.schedules.slice(0, 1).map((sched) => (
                  <div
                    key={`${sched.days}-${sched.startTime}`}
                    className="section-schedule-row"
                  >
                    <span
                      className="icon-text-container"
                      style={{ minWidth: "3rem" }}
                    >
                      <CiCalendar />
                      {sched.days || "TBA"}
                    </span>
                    <span
                      className="icon-text-container"
                      style={{ minWidth: "6.5rem" }}
                    >
                      <CiClock1 />
                      {sched.startTime && sched.endTime
                        ? `${sched.startTime} - ${sched.endTime}`
                        : "TBA"}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
    <div
      className={`course-popover ${positionStyles.arrowClass}`}
      style={{
        left: positionStyles.left,
        top: positionStyles.top,
        maxWidth: "380px",
        maxHeight: "400px",
      }}
    >
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
