import React, { useState, useEffect } from "react";
import { Hero, WeeklySchedule, TextBadge } from "@components";
import Link from "next/link";
import LandingPageHeroSrc from "../assets/images/landing-page/hero.webp";
import { getCourseAPIData } from "@utils";
import { CourseWithSectionDetails } from "@types";
import { useQuery } from "@tanstack/react-query";

interface ScheduleSettings {
  defaultTerm: string;
}

interface SavedSchedule {
  id: number;
  name: string;
  courses: CourseWithSectionDetails[];
  term: string;
  isDefault: boolean;
  timestamp: number;
}

interface CourseBlockData {
  dept: string;
  number: string;
  title: string;
  id: string;
}

const LandingPage: React.FC = () => {
  const [springSchedule, setSpringSchedule] = useState<
    CourseWithSectionDetails[]
  >([]);
  const [summerSchedule, setSummerSchedule] = useState<
    CourseWithSectionDetails[]
  >([]);
  const [activePreview, setActivePreview] = useState<string>("Spring 2025");
  const [animatedCourses, setAnimatedCourses] = useState<CourseBlockData[][]>(
    []
  );

  // Fetch popular courses for the animated blocks
  const { data: coursesData } = useQuery({
    queryKey: ["popularCourses"],
    queryFn: async () => {
      try {
        const response = await getCourseAPIData("/outlines/all");
        return response.data.slice(0, 100); // Just grab a subset of courses for animation
      } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Load saved schedules from localStorage on component mount
  useEffect(() => {
    // Load default schedules
    const loadedSchedules = localStorage.getItem("savedSchedules");

    if (loadedSchedules) {
      try {
        const schedules: SavedSchedule[] = JSON.parse(loadedSchedules);

        // Find the default schedule for Spring
        const springDefault = schedules.find(
          (s) => s.term === "Spring 2025" && s.isDefault
        );

        if (springDefault) {
          setSpringSchedule(springDefault.courses);
        }

        // Find the default schedule for Summer
        const summerDefault = schedules.find(
          (s) => s.term === "Summer 2025" && s.isDefault
        );

        if (summerDefault) {
          setSummerSchedule(summerDefault.courses);
        }
      } catch (error) {
        console.error("Error loading schedule data:", error);
      }
    }
  }, []);

  // Create animated course rows when courses data is available
  useEffect(() => {
    if (!coursesData) return;

    // Function to shuffle array
    const shuffleArray = (array: any[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Create 3 rows with random courses and assign unique speeds/directions
    const rows = [];
    for (let i = 0; i < 3; i++) {
      const shuffled = shuffleArray(coursesData)
        .slice(0, 10 + i * 5) // Different number of items per row
        .map((course) => ({
          dept: course.dept,
          number: course.number,
          title: course.title,
          id: `${course.dept}-${course.number}-${i}`,
        }));
      rows.push(shuffled);
    }

    setAnimatedCourses(rows);
  }, [coursesData]);

  // Handle schedule tab change
  const handleTabChange = (term: string) => {
    setActivePreview(term);
  };

  // Get the appropriate schedule based on active tab
  const currentSchedule =
    activePreview === "Spring 2025" ? springSchedule : summerSchedule;

  return (
    <div className="page landing-page">
      <Hero
        title="sfucourses"
        subtitle="explore and schedule the best course plan at"
        backgroundImage={LandingPageHeroSrc.src}
      />
      <main>
        {/* Schedule Preview Section */}
        <section className="container schedule-preview-section">
          <h2>Your Default Schedules</h2>
          <div className="schedule-preview-tabs">
            <button
              className={`tab-button ${
                activePreview === "Spring 2025" ? "active" : ""
              }`}
              onClick={() => handleTabChange("Spring 2025")}
            >
              Spring 2025
            </button>
            <button
              className={`tab-button ${
                activePreview === "Summer 2025" ? "active" : ""
              }`}
              onClick={() => handleTabChange("Summer 2025")}
            >
              Summer 2025
            </button>
          </div>
          {springSchedule.length > 0 || summerSchedule.length > 0 ? (
            <div className="schedule-preview-content">
              <div className="selected-courses-preview">
                <h3>Selected Courses</h3>
                {currentSchedule.length > 0 ? (
                  <div className="selected-courses-badges">
                    {currentSchedule.map((course) => (
                      <TextBadge
                        key={`${course.dept}-${course.number}`}
                        content={`${course.dept} ${course.number}`}
                        enableBgColor
                      />
                    ))}
                  </div>
                ) : (
                  <p className="no-courses">
                    No courses in default {activePreview} schedule
                  </p>
                )}
              </div>

              <div className="weekly-schedule-preview">
                {currentSchedule.length > 0 ? (
                  <WeeklySchedule
                    coursesWithSections={currentSchedule}
                    setCoursesWithSections={() => {}} // Read-only for the preview
                  />
                ) : (
                  <div className="empty-schedule-message">
                    <p>No default schedule set for {activePreview}</p>
                    <Link href="/schedule" className="create-schedule-link">
                      Create a schedule
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-default-schedules">
              <p>No default schedules have been created yet</p>
              <Link href="/schedule" className="create-schedule-button">
                Create your first schedule
              </Link>
            </div>
          )}
        </section>

        <article className="container discover-ssss">
          <Link className="discover-ssss__main-link-item" href={`/explore`}>
            <h3>explore</h3>
            <p>master the course planning game</p>
          </Link>

          <section className="discover-ssss__link-items">
            <Link href="/schedule" className="discover-ssss__link-item">
              <h3>schedule</h3>
              <p>easily create and share your schedule</p>
            </Link>
          </section>
        </article>
      </main>
    </div>
  );
};

export default LandingPage;
