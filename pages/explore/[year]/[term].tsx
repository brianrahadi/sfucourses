import { Button, Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { Course, Requirement, RequirementSchema } from "types/course";
import { z } from "zod";
import { SidebarCourse } from "components/SidebarCourse";
import { useRouter } from "next/router";
import { capitalize } from "utils";

const COURSES_JSON_URL =
  "https://raw.githubusercontent.com/ssss-sfu/course-explorer-script/main/result/courses.json";

const Courses: React.FC = () => {
  // Parse the JSON data using Zod schemas
  const router = useRouter();
  const [courseShown, setCourseShown] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any>([]);

  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

  const BASE_URL = "http://www.sfu.ca/bin/wcm/course-outlines";
  const { year, term } = router.query;

  const yearStr = Array.isArray(year) ? year[0] : year ?? "";
  const termStr = Array.isArray(term) ? term[0] : term ?? "";

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

  async function fetchCourseOutlines(year: string, term: string) {
    const termUrl = `${BASE_URL}?${year}/${term}`;

    try {
      const termJson: Array<any> = await fetchJSON(termUrl);
      setRequirements(termJson);
    } catch (error) {
      console.error("term 404 or other error:", error);
    }
  }

  useEffect(() => {
    fetchCourseOutlines(yearStr, termStr);
  }, [])

  return (
    <div className="page courses-page">
      <Hero
        title="Courses at Simon Fraser University"
        subtitle="C O U R S E S"
        backgroundImage={HeroImage.src}
      />
      <main className="container">
        <section className="main-content">
          <h1>{yearStr} {capitalize(termStr)} Courses at Simon Fraser University</h1>
        </section>
        <section className="requirements-section">
          <div
            className={`courses-container`}
          >
            {requirements.map((req: any) => (
              <a
                href={`/explore/${yearStr}/${termStr}/${req.value}`}
              >
                <Button label={`${req.text} - ${req.name}`} type="secondary" />
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Courses;
