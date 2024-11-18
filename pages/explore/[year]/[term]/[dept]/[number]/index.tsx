import { Button, Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { Course, Department, DescriptiveSection, Section } from "types/course";
import { SidebarCourse } from "components/SidebarCourse";
import { useRouter } from "next/router";
import { TERM, YEAR, getData, loadData, loadMultipleData } from "utils";
import { GetStaticPaths, GetStaticProps } from "next";

interface CoursePageProps {
  params?: {
    year: string;
    term: string;
    dept: string;
    number: string;
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allDepts: Department[] = await getData(`${YEAR}/${TERM}`);
  const deptCourseDict: Record<string, Course[]> = Object.fromEntries(
    await Promise.all(
      allDepts.map(async (dept) => {
        const courses = await getData(`${YEAR}/${TERM}/${dept.value}`);
        return [dept.value, courses] as [string, Course[]];
      })
    )
  );

  const allPaths = Object.entries(deptCourseDict)
    .filter(([dept, courses]) => dept === "cmpt" || dept === "math")
    .map(([dept, courses]) => {
      // For each department, map over the courses and return a new array of objects
      return courses.map((course) => ({
        params: {
          year: YEAR,
          term: TERM,
          dept: dept,
          number: course.value,
        },
      }));
    })
    .flat();

  return {
    paths: allPaths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<CoursePageProps> = async ({
  params,
}) => {
  if (!params?.year || !params?.term || !params?.dept || !params?.number) {
    return {
      notFound: true,
    };
  }

  const { year, term, dept, number } = params;

  return {
    props: {
      params: { year, term, dept, number } as any,
    },
    revalidate: 3600,
  };
};

const CoursePage: React.FC = () => {
  // Parse the JSON data using Zod schemas
  const router = useRouter();
  const [descriptiveSections, setDescriptiveSections] = useState<
    DescriptiveSection[]
  >([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionShown, setSectionShown] = useState<Section | null>(null);

  const { year, term, dept, number } = router.query;

  const yearStr = Array.isArray(year) ? year[0] : year ?? "";
  const termStr = Array.isArray(term) ? term[0] : term ?? "";
  const deptStr = Array.isArray(dept) ? dept[0] : dept ?? "";
  const numberStr = Array.isArray(number) ? number[0] : number ?? "";

  useEffect(() => {
    loadData(`${yearStr}/${termStr}/${deptStr}/${numberStr}`, setSections);
  }, [yearStr, termStr, deptStr, numberStr]);

  useEffect(() => {
    if (sections.length === 0) return;
    const sectionUrls = sections.map(
      (section) =>
        `${yearStr}/${termStr}/${deptStr}/${numberStr}/${section.value}`
    );
    loadMultipleData(sectionUrls, setDescriptiveSections);
  }, [sections, yearStr, termStr, deptStr, numberStr]);

  return (
    <div className="page courses-page">
      <Hero
        title={`${deptStr} ${numberStr} @ sfu`}
        backgroundImage={HeroImage.src}
      />
      <main className="container">
        <section className="main-content">
          <h1>
            {deptStr} {numberStr}{" "}
            {sections.length > 0 &&
              sections[0].title &&
              `- ${sections[0].title}`}
          </h1>
        </section>
        <section className="requirements-section">
          <div className={`sections-container`}>
            {descriptiveSections.map((section) => {
              return (
                <div key={section.info.classNumber}>
                  <p>{section.info.section}</p>
                  <p>{section.instructor[0].name}</p>
                  <p>{section.courseSchedule[0].campus}</p>
                  <ul>
                    {section.courseSchedule.map((schedule) => {
                      return (
                        <li key={schedule.sectionCode}>
                          {schedule.days}; {schedule.startTime}-
                          {schedule.endTime}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            {/* {requirements.map((req: any) => (
                            <div
                                className="btn secondary course-node"
                                key={`${req.text}`}
                                onClick={() =>
                                    setCourseShown(req !== courseShown ? req : null)
                                }
                            >
                                {`${req.text}${req.title ? ` - ${req.title}` : ""} - `}
                                <a
                                    href={`/explore/${yearStr}/${termStr}/${deptStr}/${req.value}`}
                                >
                                    link
                                </a>
                            </div>

                            //   <a
                            //   href={`/explore/${yearStr}/${termStr}/${deptStr}/${req.value}`}
                            // >
                            //   <Button label={`${req.text} - ${req.title}`} type="secondary" />
                            // </a>
                        ))} */}
          </div>
          {/* {courseShown && (
            <SidebarCourse
              course={}
              closeCourseShown={() => setCourseShown(null)}
            />
          )} */}
        </section>
      </main>
    </div>
  );
};

export default CoursePage;
