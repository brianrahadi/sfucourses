import React from "react";
import { CourseWithSectionDetails } from "@types";
import { IoRemoveCircle } from "react-icons/io5";
import { BsFillPersonFill } from "react-icons/bs";
import { MdPlace } from "react-icons/md";
import Link from "next/link";

interface CompactSelectedCoursesProps {
  selectedCourses: CourseWithSectionDetails[];
  onRemoveCourse: (
    course: CourseWithSectionDetails,
    classNumber: string
  ) => void;
  term: string;
}

export const CompactSelectedCourses: React.FC<CompactSelectedCoursesProps> = ({
  selectedCourses,
  onRemoveCourse,
  term,
}) => {
  return (
    <div className="selected-courses">
      <h3 className="section-title">
        Selected Course - {term} (
        {selectedCourses.length > 0
          ? selectedCourses
              .map((c) => +c.units)
              .reduce((prev, curr) => curr + Number(prev))
          : 0}{" "}
        units)
      </h3>

      <div className="selected-courses__items">
        {selectedCourses.length > 0 ? (
          selectedCourses.map((course) => (
            <div
              key={`${course.dept}${course.number}`}
              className="compact-course-card"
            >
              <div className="compact-course-header">
                <Link
                  href={`/explore/${course.dept.toLowerCase()}-${
                    course.number
                  }`}
                  className="no-underline"
                >
                  <span className="course-code">
                    {course.dept} {course.number} - {course.title}
                    {course.units &&
                    course.units !== "0" &&
                    course.units !== "N/A"
                      ? ` (${course.units})`
                      : ""}
                  </span>
                </Link>
              </div>

              {course.sections.map((section) => (
                <div key={section.classNumber} className="compact-section-row">
                  <div className="compact-section-info">
                    <span className="section-code">{section.section}</span>
                    {/* <span className="class-number">#{section.classNumber}</span> */}

                    <div className="section-details">
                      <span className="instructor">
                        <BsFillPersonFill />
                        {section.instructors.length > 0 ? (
                          <Link
                            href={`/instructors/${section.instructors[0]?.name}`}
                            className="no-underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {section.instructors[0].name}
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </span>
                      <span className="location">
                        <MdPlace />
                        {section.deliveryMethod !== "Online"
                          ? section.schedules[0]?.campus || "-"
                          : "Online"}
                      </span>
                    </div>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => onRemoveCourse(course, section.classNumber)}
                    aria-label="Remove course"
                  >
                    <IoRemoveCircle />
                  </button>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="gray-text empty-message">No selected courses yet</p>
        )}
      </div>
    </div>
  );
};
