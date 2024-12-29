// import { CourseTerms } from './CourseTerms';
import Link from "next/link";
import { CourseOutline } from "types/api-types";
import { Highlight } from "@components";

type CourseCardProps = {
  course: CourseOutline;
  query?: string;
};

export const CourseCard = ({ course, query }: CourseCardProps) => {
  const courseDescriptionShortened =
    course.description.length > 400
      ? course.description.slice(0, 400) + " ..."
      : course.description;

  const header = `${course.dept} ${course.number} - ${course.title} (${course.units})`;

  return (
    <Link
      href={`/course`}
      key={course.dept + course.number}
      className="course-card"
    >
      <div>
        <div className="course-title dark">
          {query ? <Highlight text={header} query={query} /> : <p>{header}</p>}
        </div>
        {query ? (
          <Highlight
            text={courseDescriptionShortened}
            query={query}
            className="course-description"
          />
        ) : (
          <p className="course-description">{courseDescriptionShortened}</p>
        )}
      </div>
    </Link>
  );
};
