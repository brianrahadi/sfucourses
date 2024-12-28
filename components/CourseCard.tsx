// import { CourseTerms } from './CourseTerms';
import Link from "next/link";
import { CourseOutline } from "types/api-types";

type CourseCardProps = {
  course: CourseOutline;
  //   className: string;
  query?: string;
};

export const CourseCard = ({ course, query }: CourseCardProps) => {
  const courseDescriptionShortened =
    course.description.length > 400
      ? course.description.slice(0, 400) + " ..."
      : course.description;

  const headerText = `${course.dept} ${course.number} - ${course.title}`;
  const stringArr = [headerText, course.description, course.notes];

  if (
    query &&
    !stringArr.some((str) => str.toLowerCase().includes(query.toLowerCase()))
  ) {
    return <></>;
  }
  return (
    <Link
      href={`/course`}
      key={course.dept + course.number}
      className="course-card"
    >
      <div>
        <div className="course-title dark">
          {headerText}
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
        <p className="course-description">{course.description}</p>
      </div>
    </Link>
  );
};
