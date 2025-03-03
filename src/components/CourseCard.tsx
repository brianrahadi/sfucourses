import React, { Dispatch, SetStateAction, useState, useRef } from "react";
import Link from "next/link";
import { CourseOutline, CourseWithSectionDetails } from "../types";
import { Highlight, SectionDetails } from "@components";
import { termToIcon } from "./ExploreFilter";
import { CoursePopover } from "./CoursePopover";

type CourseCardProps = {
  course: CourseOutline;
  query?: string;
  showPrereqs?: boolean;
  prereqsQuery?: string;
  showInstructors?: boolean;
  sectionDetails?: CourseWithSectionDetails;
  showDescription?: boolean;
  isLink?: boolean;
  setOfferings?: {
    fn: Dispatch<SetStateAction<CourseWithSectionDetails[]>>;
    type: "ADD" | "REMOVE";
  };
  type?: "SELECTED_COURSES";
  enablePopover?: boolean;
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  query,
  prereqsQuery,
  showPrereqs,
  showInstructors,
  sectionDetails,
  showDescription = true,
  isLink = true,
  setOfferings,
  type,
  enablePopover = true,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Used to delay hiding popover for better UX
  const popoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const courseDescriptionShortened =
    course.description.length > 400
      ? course.description.slice(0, 400) + " ..."
      : course.description;

  const header = `${course.dept} ${course.number} - ${course.title} (${course.units})`;

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!enablePopover) return;

    // Clear any existing timeout
    if (popoverTimeoutRef.current) {
      clearTimeout(popoverTimeoutRef.current);
      popoverTimeoutRef.current = null;
    }

    // Calculate position for popover
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();

      // Position the popover next to the card
      setPopoverPosition({
        x: rect.right + 10,
        y: rect.top,
      });

      setShowPopover(true);
    }
  };

  const handleMouseLeave = () => {
    if (!enablePopover) return;

    // Set a small timeout before hiding to allow moving to the popover
    popoverTimeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 300);
  };

  // Handle mouse enter on popover itself
  const handlePopoverMouseEnter = () => {
    if (popoverTimeoutRef.current) {
      clearTimeout(popoverTimeoutRef.current);
      popoverTimeoutRef.current = null;
    }
  };

  // Handle mouse leave on popover
  const handlePopoverMouseLeave = () => {
    setShowPopover(false);
  };

  const CardContent = () => (
    <>
      <div className="course-title dark">
        {isLink ? (
          query ? (
            <Highlight text={header} query={query} />
          ) : (
            <p>{header}</p>
          )
        ) : (
          <Link
            href={`/explore/${course.dept.toLowerCase()}-${course.number}`}
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            {query ? (
              <Highlight text={header} query={query} className="green-text" />
            ) : (
              <p className="green-text">{header}</p>
            )}
          </Link>
        )}
      </div>
      <div className="course-card__content">
        {showDescription &&
          (query ? (
            <Highlight
              text={courseDescriptionShortened}
              query={query}
              className="course-description"
            />
          ) : (
            <p className="course-description">
              {courseDescriptionShortened}
              {course.designation && course.designation != "N/A"
                ? " " + course.designation
                : ""}
            </p>
          ))}
        {showPrereqs && !prereqsQuery ? (
          <p className="course-description">
            Prerequisite: {course.prerequisites || "None"}
          </p>
        ) : prereqsQuery ? (
          <Highlight
            initialText="Prerequisites: "
            text={course.prerequisites}
            query={prereqsQuery}
            className="course-description"
          />
        ) : (
          <></>
        )}
        <div className="course-card__row">
          {showInstructors &&
            course.offerings &&
            course.offerings
              .filter((offering) => offering.instructors.length !== 0)
              .map((offering) => {
                const text = `${offering.instructors[0]}${
                  offering.instructors.length > 1
                    ? ` +${offering.instructors.length - 1}`
                    : ""
                }`;
                return (
                  <div
                    className="text-badge"
                    key={offering.instructors + offering.term}
                  >
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
        <div className="course-card__row">
          {sectionDetails && (
            <SectionDetails
              offering={sectionDetails}
              setOfferings={setOfferings}
              type={type}
              query={query}
            />
          )}
        </div>
      </div>
    </>
  );

  // Render the popover
  const renderPopover = () => {
    if (!enablePopover) return null;

    return (
      <div
        onMouseEnter={handlePopoverMouseEnter}
        onMouseLeave={handlePopoverMouseLeave}
      >
        <CoursePopover
          course={course}
          isVisible={showPopover}
          position={popoverPosition}
        />
      </div>
    );
  };

  if (isLink) {
    return (
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`course-card-container ${showPopover ? "show-popover" : ""}`}
      >
        <Link
          href={`/explore/${course.dept.toLowerCase()}-${course.number}`}
          key={course.dept + course.number}
          className="course-card is-link"
        >
          <CardContent />
        </Link>
        {renderPopover()}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className={`course-card-container ${showPopover ? "show-popover" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="course-card">
        <CardContent />
      </div>
      {renderPopover()}
    </div>
  );
};
