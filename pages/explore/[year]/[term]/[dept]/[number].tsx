import { Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { Course, Requirement, RequirementSchema } from "types/course";
import { z } from "zod";
import { SidebarCourse } from "components/SidebarCourse";
import { useRouter } from "next/router";

const COURSES_JSON_URL =
  "https://raw.githubusercontent.com/ssss-sfu/course-explorer-script/main/result/courses.json";

const CoursePage: React.FC = () => {
    const router = useRouter(); // Initialize the router
    const { dept, number } = router.query;
  // Parse the JSON data using Zod schemas
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
    //   const termJson: Array<any> = await fetchJSON(termUrl);
    //   setRequirements(termJson);
        const courseUrl = `${BASE_URL}?${year}/${term}/${dept}/${number}`;
        try {
            const courseJson: Array<any> = await fetchJSON(courseUrl);
            setRequirements(courseJson);
        } catch (error) {
            console.warn(`Course ${dept} 404: ${error}`);
        }
      // }
    } catch (error) {
      console.error("TERM 404 or other error:", error);
    }
  }

  useEffect(() => {
    fetchCourseOutlines(YEAR, TERM);
  }, [])

  // useEffect(() => {
  //   const fetchCourses = async () => {
  //     try {
  //       const cachedData = localStorage.getItem("courses");
  //       const lastFetchTime = localStorage.getItem("lastFetchTime");
  //       const currentTime = Date.now();

  //       // Check if the cached data exists and if it's been less than a week since last fetch
  //       if (
  //         cachedData &&
  //         lastFetchTime &&
  //         currentTime - new Date(lastFetchTime).getTime() < ONE_WEEK
  //       ) {
  //         const json = JSON.parse(cachedData);
  //         setRequirements(z.array(RequirementSchema).parse(json));
  //       } else {
  //         // Fetch new data if no cached data or if a week has passed
  //         const json = await (await fetch(COURSES_JSON_URL)).json();
  //         localStorage.setItem("courses", JSON.stringify(json));
  //         localStorage.setItem("lastFetchTime", currentTime.toString());
  //         setRequirements(z.array(RequirementSchema).parse(json));
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };

  //   fetchCourses();
  // }, []);

  return (
    <div className="page courses-page">
      <Hero
        title={`${dept?.toString().toUpperCase()} Courses`}
        subtitle="Courses"
        backgroundImage={HeroImage.src}
      />
      <main className="container">
        <section className="main-content">
          <h1>{dept?.toString().toUpperCase()} Courses</h1>
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
              <div className="btn secondary course-node">
                {req.text} - {req.title}
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

export default CoursePage;
