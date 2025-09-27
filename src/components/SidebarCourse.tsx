import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CourseOutline, CourseWithSectionDetails } from "../types";
import { RedditPosts } from "@components";
import { getCourseAPIData } from "@utils";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaExternalLinkAlt } from "react-icons/fa";

// Cache for course outline data
const courseOutlineCache = new Map<string, CourseOutline>();

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
      <div className="course-details-inline">
        <div className="course-info">
          <p>Loading course information...</p>
        </div>
      </div>
    );
  }

  if (!courseOutline) {
    return (
      <div className="course-details-inline">
        <div className="course-info">
          <p>Course information not available</p>
        </div>
      </div>
    );
  }
  return (
    <div className="course-details-inline">
      <div className="back-arrow" onClick={onClose}>
        <IoArrowBackOutline className="back-arrow-icon" />
      </div>
      <Link
        href={`/explore/${courseOutline.dept.toLowerCase()}-${
          courseOutline.number
        }`}
        target="_blank"
        rel="noreferrer"
        className="course-info-header"
      >
        {courseOutline.dept} {courseOutline.number} ({courseOutline.units})
      </Link>
      <div className="course-info">
        <h3>{courseOutline.title}</h3>
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
