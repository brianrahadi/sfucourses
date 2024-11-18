import { Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { SidebarCourse } from "components/SidebarCourse";
import { useRouter } from "next/router";
import { loadData } from "utils";
import { Course } from "types/course";

const DepartmentPage: React.FC = () => {
  // Parse the JSON data using Zod schemas
  const router = useRouter();
  const [courseShown, setCourseShown] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  const { year, term, dept } = router.query;

  const yearStr = Array.isArray(year) ? year[0] : year ?? "";
  const termStr = Array.isArray(term) ? term[0] : term ?? "";
  const deptStr = Array.isArray(dept) ? dept[0] : dept ?? "";

  useEffect(() => {
    loadData(`${yearStr}/${termStr}/${deptStr}`, setCourses);
  }, [yearStr, termStr, deptStr]);

  return (
    <div className="page courses-page">
      <Hero
        title={`${deptStr} courses @ sfu`}
        backgroundImage={HeroImage.src}
      />
      <main className="container">
        <section className="main-content">
          <h1>
            {termStr} {yearStr} {deptStr} courses
          </h1>
        </section>
        <section className="requirements-section">
          <div className={`courses-container`}>
            {courses.map((course) => (
              <div
                className="btn secondary course-node"
                key={`${course.text}`}
                onClick={() =>
                  setCourseShown(course !== courseShown ? course : null)
                }
              >
                {`${course.text}${course.title ? ` - ${course.title}` : ""} - `}
                <a
                  href={`/explore/${yearStr}/${termStr}/${deptStr}/${course.value}`}
                >
                  link
                </a>
              </div>
            ))}
          </div>
          {courseShown && (
            <SidebarCourse
              course={courseShown}
              closeCourseShown={() => setCourseShown(null)}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default DepartmentPage;
