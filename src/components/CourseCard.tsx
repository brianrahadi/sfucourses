import React, { Dispatch, SetStateAction, useState, useEffect } from "react";
import Link from "next/link";
import { CourseOutline, CourseWithSectionDetails } from "../types";
import { Highlight, SectionDetails, RedditPosts } from "@components";
import { termToIcon } from "@utils/exploreFilters";
import { getCourseAPIData } from "@utils";

// Cache for course outline data
const courseOutlineCache = new Map<string, CourseOutline>();

type CourseCardProps = {
  course: CourseOutline | CourseWithSectionDetails;
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
  setPreviewCourse?: Dispatch<CourseWithSectionDetails | null>;
  onCourseHover?: (course: CourseOutline | null) => void;
  onCourseClick?: (course: CourseOutline) => void;
};

interface SidebarCourseProps {
  course: CourseOutline | CourseWithSectionDetails;
  onClose: () => void;
  isPinned?: boolean;
}

const useCourseOutline = (course: CourseOutline | CourseWithSectionDetails) => {
  const [courseOutline, setCourseOutline] = useState<CourseOutline | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ("description" in course) {
      setCourseOutline(course as CourseOutline);
      return;
    }

    const cacheKey = `${course.dept}-${course.number}`;

    // Check cache first
    if (courseOutlineCache.has(cacheKey)) {
      setCourseOutline(courseOutlineCache.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    getCourseAPIData(`/outlines?dept=${course.dept}&number=${course.number}`)
      .then((res) => {
        const outline = res[0] || null;
        if (outline) {
          // Cache the result
          courseOutlineCache.set(cacheKey, outline);
        }
        setCourseOutline(outline);
      })
      .catch(() => {
        setCourseOutline(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [course.dept, course.number]);

  return { courseOutline, isLoading };
};

export const SidebarCourse: React.FC<SidebarCourseProps> = ({
  course,
  onClose,
  isPinned = false,
}) => {
  const { courseOutline, isLoading } = useCourseOutline(course);

  if (isLoading) {
    return (
      <div className="sidebar-course">
        <div className="course-info">
          <p>Loading course information...</p>
        </div>
      </div>
    );
  }

  if (!courseOutline) {
    return (
      <div className="sidebar-course">
        <div className="course-info">
          <p>Course information not available</p>
        </div>
      </div>
    );
  }
  return (
    <div className="sidebar-course">
      <div className="course-info">
        <p className="space-between">
          <span>
            {courseOutline.dept} {courseOutline.number} ({courseOutline.units})
          </span>
          <span className="close-sidebar" onClick={onClose}>
            Close
          </span>
        </p>
        <h2>
          <Link
            href={`/explore/${courseOutline.dept.toLowerCase()}-${
              courseOutline.number
            }`}
            target="_blank"
            rel="noreferrer"
            className="course-title-link"
          >
            {courseOutline.title}
          </Link>
        </h2>
        <p>{courseOutline.description}</p>
        {courseOutline.notes && <p>{courseOutline.notes}</p>}
        <p>
          Prerequisites:{" "}
          {courseOutline.prerequisites !== ""
            ? courseOutline.prerequisites
            : "None"}
        </p>
      </div>
      <div className="reddit-section">
        <RedditPosts
          query={`${courseOutline.dept.toLowerCase()} ${courseOutline.number}`}
        />
      </div>
    </div>
  );
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
  setPreviewCourse,
  onCourseHover,
  onCourseClick,
}) => {
  const [showAllSections, setShowAllSections] = useState(false);
  const [showLabTut, setShowLabTut] = useState(false);

  const handleCourseHover = (
    courseData: CourseOutline | CourseWithSectionDetails | null
  ) => {
    if (!onCourseHover) return;

    if (!courseData) {
      onCourseHover(null);
      return;
    }

    // If it's already a CourseOutline, pass it directly
    if ("description" in courseData) {
      onCourseHover(courseData as CourseOutline);
    } else {
      // If it's CourseWithSectionDetails, we'll let the sidebar handle the conversion
      onCourseHover(courseData as any);
    }
  };

  const handleCourseClick = (
    courseData: CourseOutline | CourseWithSectionDetails
  ) => {
    if (!onCourseClick) return;

    // If it's already a CourseOutline, pass it directly
    if ("description" in courseData) {
      onCourseClick(courseData as CourseOutline);
    } else {
      // If it's CourseWithSectionDetails, we'll let the sidebar handle the conversion
      onCourseClick(courseData as any);
    }
  };

  const courseDescriptionShortened =
    showDescription &&
    "description" in course &&
    course.description &&
    course.description.length > 400
      ? course.description.slice(0, 400) + " ..."
      : "description" in course
      ? course.description
      : "";

  const header = `${course.dept} ${course.number} - ${course.title}${
    course.units && course.units !== "0" && course.units !== "N/A"
      ? ` (${course.units})`
      : ""
  }`;
  const CardContent = () => (
    <>
      <div
        className="course-title"
        onMouseEnter={() => handleCourseHover(course)}
        onMouseLeave={() => handleCourseHover(null)}
        onClick={() => handleCourseClick(course)}
        style={{ cursor: onCourseClick ? "pointer" : "default" }}
      >
        {query ? (
          <Highlight text={header} query={query} className="green-text" />
        ) : (
          <p className="green-text">{header}</p>
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
              {"designation" in course &&
              course.designation &&
              course.designation != "N/A"
                ? " " + course.designation
                : ""}
            </p>
          ))}
        {showPrereqs && !prereqsQuery && "prerequisites" in course ? (
          <p className="course-description">
            Prerequisite: {course.prerequisites || "N/A"}
          </p>
        ) : prereqsQuery && "prerequisites" in course ? (
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
            "offerings" in course &&
            course.offerings &&
            course.offerings
              .filter((offering: any) => offering.instructors.length !== 0)
              .map((offering: any) => {
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
              setPreviewCourse={setPreviewCourse}
              showAllSections={showAllSections}
              onToggleShowAllSections={() => setShowAllSections((v) => !v)}
              showLabTut={showLabTut}
              onToggleShowLabTut={() => setShowLabTut((v) => !v)}
            />
          )}
        </div>
      </div>
    </>
  );

  if (isLink) {
    return (
      <Link
        href={`/explore/${course.dept.toLowerCase()}-${course.number}`}
        key={course.dept + course.number}
        className="course-card is-link"
      >
        <CardContent />
      </Link>
    );
  }

  return (
    <div className="course-card">
      <CardContent />
    </div>
  );
};
