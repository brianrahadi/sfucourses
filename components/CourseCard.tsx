// import { CourseTerms } from './CourseTerms';
import Link from "next/link";
import { CourseOutline } from "types/api-types";
import { Highlight } from "@components";

type CourseCardProps = {
  course: CourseOutline;
  query?: string;
  showPrereqs?: boolean;
  prereqsQuery?: string;
  hasNoPrereq?: boolean;
  showDesignations?: boolean;
};

export const CourseCard = ({
  course,
  query,
  prereqsQuery,
  showPrereqs,
  hasNoPrereq,
  showDesignations,
}: CourseCardProps) => {
  const courseDescriptionShortened =
    course.description.length > 400
      ? course.description.slice(0, 400) + " ..."
      : course.description;

  const header = `${course.dept} ${course.number} - ${course.title} (${course.units})`;
  const isUndergrad = course.number[0] <= "4";

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
          <p className="course-description">{courseDescriptionShortened}</p>
        )}
        <p>Terms: {course.terms.join(", ")}</p>
        {showPrereqs && !prereqsQuery ? (
          <p>Prerequisite: {course.prerequisites || "None"}</p>
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
        {showDesignations ? (
          <p>Designations: {course.designation || "N/A"}</p>
        ) : (
          <></>
        )}
      </div>
    </Link>
  );
};
