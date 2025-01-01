// import { CourseTerms } from './CourseTerms';
import Link from "next/link";
import { CourseOutline } from "../types";
import { Button, Highlight, TextBadge } from "@components";
import { termToIcon } from "./ExploreFilter";

type CourseCardProps = {
  course: CourseOutline;
  query?: string;
  showPrereqs?: boolean;
  prereqsQuery?: string;
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  query,
  prereqsQuery,
  showPrereqs,
}) => {
  const courseDescriptionShortened =
    course.description.length > 400
      ? course.description.slice(0, 400) + " ..."
      : course.description;

  const header = `${course.dept} ${course.number} - ${course.title} (${course.units})`;

  return (
    <Link
      href={`/explore/${course.dept.toLowerCase()}-${course.number}`}
      key={course.dept + course.number}
      className="course-card"
    >
      <div className="course-title dark">
        {query ? <Highlight text={header} query={query} /> : <p>{header}</p>}
      </div>
      <div className="course-card__content">
        {query ? (
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
        )}
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
          {course.offerings
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
      </div>
    </Link>
  );
};
