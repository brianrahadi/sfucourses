import { Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { SidebarCourse } from "components/SidebarCourse";
import { useRouter } from "next/router";
import { TERM, YEAR, getData, loadData } from "utils";
import { Course, Department } from "types/course";
import { GetStaticPaths, GetStaticProps } from "next";

interface DepartmentPageProps {
  initialCourses?: Course[];
  params?: {
    year: string;
    term: string;
    dept: string;
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allDepts: Department[] = await getData(`${YEAR}/${TERM}`);
  const allPaths = allDepts
    .filter((dept) => dept.name)
    .map((dept) => ({
      params: {
        year: YEAR,
        term: TERM,
        dept: dept.value,
      },
    }));

  return {
    paths: allPaths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<DepartmentPageProps> = async ({
  params,
}) => {
  if (!params?.year || !params?.term || !params?.dept) {
    return {
      notFound: true,
    };
  }

  const { year, term, dept } = params;
  const yearStr = Array.isArray(year) ? year[0] : year;
  const termStr = Array.isArray(term) ? term[0] : term;
  const deptStr = Array.isArray(dept) ? dept[0] : dept;

  try {
    const courses: Course[] = await getData(`${yearStr}/${termStr}/${deptStr}`);

    return {
      props: {
        initialCourses: courses,
        params: { yearStr, termStr, deptStr } as any,
      },
      // Revalidate every day
      revalidate: 86400, // 24 hours
    };
  } catch (error) {
    console.error("Error loading DepartmentPage:", error);
    return {
      notFound: true,
    };
  }
};

const DepartmentPage: React.FC<DepartmentPageProps> = ({
  initialCourses,
  params,
}) => {
  // Parse the JSON data using Zod schemas
  const router = useRouter();
  const [courseShown, setCourseShown] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>(initialCourses || []);

  const { year, term, dept } = router.query;

  const yearStr = Array.isArray(year) ? year[0] : year ?? "";
  const termStr = Array.isArray(term) ? term[0] : term ?? "";
  const deptStr = Array.isArray(dept) ? dept[0] : dept ?? "";

  useEffect(() => {
    if (courses.length === 0) {
      loadData(`${yearStr}/${termStr}/${deptStr}`, setCourses);
    }
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
