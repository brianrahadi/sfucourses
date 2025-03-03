import {
  CourseTabContainer,
  Helmet,
  Hero,
  RedditPosts,
  SectionDetails,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { loadCourseAPIData, getCourseAPIData } from "@utils";
import { CourseOutline } from "@types";
import { useRouter } from "next/router";
import { useCourseOfferings } from "@hooks";
import { RotatingLines } from "react-loader-spinner";
import { GetStaticProps, GetStaticPaths } from "next";

interface CoursePageProps {
  initialCourse?: CourseOutline;
}

interface CourseCode {
  dept: string | undefined;
  number: string | undefined;
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const response = await getCourseAPIData("/outlines/all");
    const courses: CourseOutline[] = response.data;

    const targetDepts = ["ACMA", "CMPT"];
    const filteredCourses = courses.filter((course) =>
      targetDepts.includes(course.dept)
    );

    const paths = filteredCourses.map((course) => ({
      params: {
        code: `${course.dept.toLowerCase()}-${course.number}`,
      },
    }));

    return {
      paths,
      fallback: true,
    };
  } catch (error) {
    console.error("Error generating static paths:", error);
    return {
      paths: [],
      fallback: true,
    };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.code || typeof params.code !== "string") {
    return { notFound: true };
  }

  try {
    // Extract dept and number from the code parameter
    const courseStrs = params.code.toLowerCase().split("-");
    const dept = courseStrs[0];
    const number = courseStrs[1];

    if (!dept || !number) {
      return { notFound: true };
    }

    // Fetch the course outline data
    const courseData = await getCourseAPIData(`/outlines/${dept}/${number}`);

    return {
      props: {
        initialCourse: courseData,
      },
      revalidate: 86400,
    };
  } catch (error) {
    console.error(`Error fetching course data:`, error);
    return { notFound: true };
  }
};

const CoursePage: React.FC<CoursePageProps> = ({ initialCourse }) => {
  const router = useRouter();
  const { code } = router.query;

  const [course, setCourse] = useState<CourseOutline | undefined>(
    initialCourse
  );

  useEffect(() => {
    if (initialCourse) {
      setCourse(initialCourse);
      return;
    }

    if (router.isFallback) {
      return;
    }

    const courseStrs =
      typeof code === "string" ? code.toLowerCase().split("-") : [];
    const courseCode: CourseCode = {
      dept: courseStrs[0] || undefined,
      number: courseStrs[1] || undefined,
    };

    if (courseCode.dept && courseCode.number) {
      loadCourseAPIData(
        `/outlines/${courseCode.dept}/${courseCode.number}`,
        setCourse
      );
    }
  }, [code, initialCourse, router.isFallback]);

  const { offerings, isLoading, error, isIdle } = useCourseOfferings(course);

  // Handle fallback state
  if (router.isFallback) {
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

  // Handle invalid course code
  if (!course || !course.dept || !course.number) {
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

  // Handle loading
  if (isLoading) {
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
  const tabs = offerings.map((offering) => ({
    id: offering.term,
    label: offering.term,
    content: <SectionDetails offering={offering} />,
  }));

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
              {`${course.dept} ${course.number} - ${course.title} (${course.units})`}
            </div>
            <div className="course-page-card__connt">
              <p className="course-description">
                {course.description}
                {course.designation && course.designation != "N/A"
                  ? " " + course.designation
                  : ""}
              </p>
              <p className="course-description">
                Prerequisite: {course.prerequisites || "None"}
              </p>
            </div>
          </div>
          <div className="course-offerings">
            {isIdle ? (
              "Waiting for course data..."
            ) : error ? (
              `Error loading offerings: ${error.message}`
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
