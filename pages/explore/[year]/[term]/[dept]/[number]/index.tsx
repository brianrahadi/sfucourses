import { Button, Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { Course, Department, DescriptiveSection, Section } from "types/course";
import { useRouter } from "next/router";
import { TERM, YEAR, getData, loadData, loadMultipleData } from "utils";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { Breadcrumb } from "components/Breadcrumb";

interface CoursePageProps {
  initialSections?: Section[];
  initialDescriptiveSections?: DescriptiveSection[];
  params?: {
    year: string;
    term: string;
    dept: string;
    number: string;
  };
  notFound?: boolean;
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
      return courses
        .filter((c) => c.title)
        .map((course) => ({
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
    paths: [],
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
  const yearStr = Array.isArray(year) ? year[0] : year;
  const termStr = Array.isArray(term) ? term[0] : term;
  const deptStr = Array.isArray(dept) ? dept[0] : dept;
  const numberStr = Array.isArray(number) ? number[0] : number;

  try {
    const data = await getData(`${yearStr}/${termStr}/${deptStr}/${numberStr}`);

    const sections: Section[] = data;

    const sectionsPath = sections.map(
      (section) =>
        `${yearStr}/${termStr}/${deptStr}/${numberStr}/${section.value}`
    );
    const descriptiveSections: DescriptiveSection[] = await Promise.all(
      sectionsPath.map(async (path) => {
        return await getData(path);
      })
    );
    return {
      props: {
        initialSections: sections,
        initialDescriptiveSections: descriptiveSections,
        params: { yearStr, termStr, deptStr, numberStr } as any,
      },
      // Revalidate every day
      revalidate: 86400, // 24 hours
    };
  } catch (error) {
    console.error("Error loading CoursePage:", error);
    return {
      notFound: true,
    };
  }
};

const CoursePage: React.FC<CoursePageProps> = ({
  initialSections,
  initialDescriptiveSections,
  params,
  notFound,
}) => {
  // Parse the JSON data using Zod schemas
  const router = useRouter();
  const [descriptiveSections, setDescriptiveSections] = useState<
    DescriptiveSection[]
  >(initialDescriptiveSections || []);
  const [sections, setSections] = useState<Section[]>(initialSections || []);
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
    // loadData(sectionUrls[0], (data) => setDescriptiveSections([data]));
  }, [sections, yearStr, termStr, deptStr, numberStr]);

  return (
    <div className="page courses-page">
      <Hero
        title={`${deptStr} ${numberStr} @ sfu`}
        backgroundImage={HeroImage.src}
      />
      <main className="container">
        <section className="main-content">
          <Breadcrumb
            year={yearStr}
            term={termStr}
            dept={deptStr}
            number={numberStr}
          />
          <h1>
            {deptStr} {numberStr}{" "}
            {sections.length > 0 &&
              sections[0].title &&
              `- ${sections[0].title}`}
          </h1>
          <p>{descriptiveSections[0]?.info?.description}</p>
          {descriptiveSections[0]?.info?.notes && (
            <p>{descriptiveSections[0].info.notes}</p>
          )}
          <p>
            Prerequisites:{" "}
            {descriptiveSections[0]?.info?.prerequisites !== ""
              ? descriptiveSections[0]?.info?.prerequisites
              : "None"}
          </p>
        </section>
        <br />
        <h2>Sections</h2>
        <section className="requirements-section">
          <div className={`sections-container`}>
            {descriptiveSections.map((section) => {
              return (
                <div key={section?.info?.classNumber}>
                  <p>{section?.info?.section}</p>
                  <p>{section?.instructor?.[0]?.name}</p>
                  <p>
                    {section?.courseSchedule?.[0]?.campus || "Unknown campus"}
                  </p>
                  <ul>
                    {section?.courseSchedule?.map((schedule) => {
                      return (
                        <li key={schedule?.sectionCode}>
                          {schedule?.days || "Unknown days"};{" "}
                          {schedule?.startTime}
                          {schedule?.endTime && ` - ${schedule?.endTime}`}
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
