// import { CourseTerms } from './CourseTerms';
import Link from "next/link";
import { CourseOutline } from "types/api-types";

type CourseCardProps = {
  course: CourseOutline;
  //   className: string;
  //   query?: string;
};

export const CourseCard = ({ course }: CourseCardProps) => {
  const courseDescriptionShortened =
    course.description.length > 400
      ? course.description.slice(0, 400) + " ..."
      : course.description;

  return (
    <Link
      href={`/course`}
      key={course.dept + course.number}
      className="course-card"
    >
      <div>
        <div className="course-title dark">
          {`${course.dept} ${course.number} - ${course.title}`}
          {/* {query ? (
            <
              text={`${spliceCourseCode(course._id, ' ')} - ${course.title}`}
              query={query}
            />
          ) : (
            `${spliceCourseCode(course._id, ' ')} - ${course.title}`
          )} */}
        </div>
        {/* <CourseTerms course={course} variant='small' query={query} /> */}
        <div className="course-description">{course.description}</div>
      </div>
    </Link>
  );
};
