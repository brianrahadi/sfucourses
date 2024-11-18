import { Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { SidebarCourse } from "components/SidebarCourse";
import { useRouter } from "next/router";
import { loadData } from "utils";
import { Course } from "types/course";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";

interface DepartmentPageProps {
  initialCourses?: Course[];
  params?: {
    year: string;
    term: string;
    dept: string;
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  // You can pre-render popular department pages
  const popularPaths = [
    {
      params: {
        year: "2025",
        term: "spring",
        dept: "cmpt",
      },
    },
    // Add more popular departments as needed
  ];

  return {
    paths: popularPaths,
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

  return {
    props: {
      initialCourses: [],
      params: { year, term, dept } as any,
    },
    // Revalidate every hour
    revalidate: 3600,
  };
};

const DepartmentPage: React.FC<DepartmentPageProps> = ({
  initialCourses,
  params,
}) => {
  const router = useRouter();
  const [courseShown, setCourseShown] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>(initialCourses || []);

  // Handle the case when the page is being generated
  if (router.isFallback) {
    return (
      <div className="page courses-page">
        <div className="container flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <h2 className="mt-4 text-xl">Loading department courses...</h2>
          </div>
        </div>
      </div>
    );
  }

  const { year, term, dept } = params || {};

  if (!year || !term || !dept) {
    return (
      <div className="page courses-page">
        <div className="container">
          <div className="text-center py-10">
            <h2 className="text-xl text-red-600">
              Invalid department parameters
            </h2>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page courses-page">
      <Hero title={`${dept} courses @ sfu`} backgroundImage={HeroImage.src} />
      <main className="container">
        <section className="main-content">
          <h1>
            {term} {year} {dept} courses
          </h1>
        </section>
        <section className="requirements-section">
          <div
            className={`courses-container grid gap-4 md:grid-cols-2 lg:grid-cols-3`}
          >
            {courses.map((course) => (
              <div
                key={`${course.text}`}
                className="relative p-4 border rounded-lg hover:shadow-lg transition-shadow duration-200"
              >
                <div
                  className="cursor-pointer mb-2"
                  onClick={() =>
                    setCourseShown(course !== courseShown ? course : null)
                  }
                >
                  <h3 className="text-lg font-medium">
                    {course.text}
                    {course.title && (
                      <span className="ml-2 text-gray-600">
                        - {course.title}
                      </span>
                    )}
                  </h3>
                </div>
                <Link
                  href={`/explore/${year}/${term}/${dept}/${course.value}`}
                  className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                >
                  View Course Details
                </Link>
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

// Helper function to validate department existence
async function checkDepartmentExists(
  year: string,
  term: string,
  dept: string
): Promise<boolean> {
  try {
    // Implement your validation logic here
    // For example, make an API call to check if the department exists
    // Return true if department exists, false otherwise
    return true;
  } catch (error) {
    return false;
  }
}

export default DepartmentPage;
