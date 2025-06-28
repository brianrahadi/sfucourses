import {
  CourseTabContainer,
  Helmet,
  Hero,
  RedditPosts,
  SectionDetails,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { loadCourseAPIData } from "@utils";
import { CourseOutline } from "@types";
import { useRouter } from "next/router";
import Link from "next/link";
import { useCourseOfferings } from "@hooks";
import { RotatingLines } from "react-loader-spinner";

interface CoursePageProps {}

interface CourseCode {
  dept: string | undefined;
  number: string | undefined;
}

const CoursePage: React.FC<CoursePageProps> = () => {
  const router = useRouter();
  const { code } = router.query;

  const courseStrs =
    typeof code === "string" ? code.toLowerCase().split("-") : [];
  const courseCode: CourseCode = {
    dept: courseStrs[0] || undefined,
    number: courseStrs[1] || undefined,
  };

  const [course, setCourse] = useState<CourseOutline | undefined>();
  const [showInvalid, setShowInvalid] = useState(false);

  useEffect(() => {
    if (courseCode.dept && courseCode.number) {
      loadCourseAPIData(
        `/outlines/${courseCode.dept}/${courseCode.number}`,
        setCourse
      );
    }
  }, [courseCode.dept, courseCode.number]);

  useEffect(() => {
    if (!courseCode.dept || !courseCode.number) {
      const timer = setTimeout(() => setShowInvalid(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowInvalid(false);
    }
  }, [courseCode.dept, courseCode.number]);

  const { offerings, isLoadingOfferings, errorOfferings, isIdleOfferings } =
    useCourseOfferings(course);

  const [showAllSectionsMap, setShowAllSectionsMap] = useState<
    Record<string, boolean>
  >({});
  const [showLabTutMap, setShowLabTutMap] = useState<Record<string, boolean>>(
    {}
  );

  if (showInvalid) {
    return (
      <div className="page courses-page">
        <Hero title="explore courses" backgroundImage={HeroImage.src} />
        <main className="container">
          <div className="center">
            <h2>Whoopsie! Invalid course code provided</h2>
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page courses-page">
        <Hero title="explore courses" backgroundImage={HeroImage.src} />
        <main className="container">
          <div className="center">
            <RotatingLines visible={true} strokeColor="#24a98b" />
          </div>
        </main>
      </div>
    );
  }

  // Prepare tabs for the TabContainer
  const tabs = offerings.map((offering) => {
    const key = offering.term;

    return {
      id: offering.term,
      label: offering.term,
      content: (
        <SectionDetails
          offering={offering}
          showAllSections={!!showAllSectionsMap[key]}
          onToggleShowAllSections={() =>
            setShowAllSectionsMap((prev) => ({
              ...prev,
              [key]: !prev[key],
            }))
          }
          showLabTut={!!showLabTutMap[key]}
          onToggleShowLabTut={() =>
            setShowLabTutMap((prev) => ({
              ...prev,
              [key]: !prev[key],
            }))
          }
        />
      ),
    };
  });

  return (
    <div className="page courses-page">
      <Helmet pageTitle={`${course.dept.toLowerCase()} ${course.number}`} />
      <Hero
        title={`explore ${course.dept.toLowerCase()} ${course.number} @ sfu`}
        backgroundImage={HeroImage.src}
      />
      <main className="container course-container">
        <div className="course-top-container">
          <div className="course-page-card">
            <div className="course-title">
              {`${course.dept} ${course.number} - ${course.title}${
                course.units && course.units !== "0" && course.units !== "N/A"
                  ? ` (${course.units})`
                  : ""
              }`}
            </div>
            <div className="course-page-card__connt">
              <p className="course-description">
                {course.description}
                {course.designation && course.designation != "N/A"
                  ? " " + course.designation
                  : ""}
              </p>
              <p className="course-description">
                Prerequisite: {course.prerequisites || "N/A"}
              </p>
            </div>
          </div>
          <div className="course-offerings">
            {isLoadingOfferings || isIdleOfferings ? (
              <RotatingLines visible={true} strokeColor="#24a98b" />
            ) : errorOfferings ? (
              `Error loading offerings: ${errorOfferings.message}`
            ) : offerings.length === 0 ? (
              "No offerings available"
            ) : (
              <CourseTabContainer tabs={tabs} />
            )}
          </div>
        </div>
        <RedditPosts dept={course.dept} number={course.number} />{" "}
      </main>
    </div>
  );
};

export default CoursePage;
