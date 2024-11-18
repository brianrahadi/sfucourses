import { Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { Course, Requirement, RequirementSchema } from "types/course";
import { z } from "zod";
import { SidebarCourse } from "components/SidebarCourse";
import { useRouter } from "next/router";

const COURSES_JSON_URL =
  "https://raw.githubusercontent.com/ssss-sfu/course-explorer-script/main/result/courses.json";

const Courses: React.FC = () => {
  // Parse the JSON data using Zod schemas
  const router = useRouter();
  const [courseShown, setCourseShown] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any>([]);

  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

  const BASE_URL = "http://www.sfu.ca/bin/wcm/course-outlines";
  const YEAR = 2024;
  const TERM = "fall";

  async function fetchJSON(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("404");
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  async function fetchCourseOutlines(year: number, term: string) {
    const termUrl = `${BASE_URL}?${year}/${term}`;

    try {
      const termJson: Array<any> = await fetchJSON(termUrl);
      setRequirements(termJson);
    } catch (error) {
      console.error("TERM 404 or other error:", error);
    }
  }

  useEffect(() => {
    fetchCourseOutlines(YEAR, TERM);
  }, []);

  return (
    <div className="page courses-page">
      <Hero
        title="See the courses available at Software Systems"
        subtitle="Courses"
        backgroundImage={HeroImage.src}
      />
      <main className="container">
        <section className="main-content">
          <h1>Courses at Software Systems</h1>
          <p>
            Mandatory and semi-mandatory courses offered as part of the degree
            requirement of SFU Software Systems.
          </p>
          <p>
            Note: Not all the courses are mandatory. In the Systems or Software
            Engineering requirements, students only need to take 3 or 2 out of
            the listed courses as example.
          </p>
          <p>
            Refer to Software Systems{" "}
            <a
              href="https://www.sfu.ca/students/calendar/2024/spring/programs/software-systems/major/bachelor-of-science.html"
              target="_blank"
              rel="noreferrer"
            >
              program calendar site
            </a>{" "}
            or{" "}
            <a
              href="https://www.sfu.ca/computing/current-students/undergraduate-students/forms"
              target="_blank"
              rel="noreferrer"
            >
              forms site
            </a>{" "}
            for official resources.
          </p>
          <p>Last updated: Oct 8, 2024</p>
        </section>
        <section className="requirements-section">
          <div
            className={`courses-container`}
          >
            {/* {requirements.map((req: Requirement) => (
              <div className="requirement-block" key={req.requirement}>
                <h2>{req.requirement}</h2>
                <div className="courses-container">
                  {req.courses.map((course: Course) => (
                    <div
                      className="btn secondary course-node"
                      key={`${course.info.dept}-${course.info.number}`}
                      onClick={() =>
                        setCourseShown(course !== courseShown ? course : null)
                      }
                    >
                      {`${course.info.dept} ${course.info.number}`}
                    </div>
                  ))}
                </div>
              </div>
            ))} */}

            {requirements.map((req: any) => (
              <div className="btn secondary course-node" onClick={() => {
                router.push(`/${req.value}`)
              }}>
                {req.text} - {req.name}
                  {/* {req.courses.map((course: Course) => (
                    <div
                      className="btn secondary course-node"
                    >
                      {`${req.value}`}
                    </div>
                  ))} */}
                </div>
            ))}
          </div>
          {/* {courseShown && (
            <SidebarCourse
              course={courseShown}
              closeCourseShown={() => setCourseShown(null)}
            />
          )} */}
        </section>
      </main>
    </div>
  );
};

export default Courses;
