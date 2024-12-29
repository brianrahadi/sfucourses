import { ExploreFilter, Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { getData, loadData, numberWithCommas } from "utils";
import { CourseOutline } from "types/api-types";
import { CourseCard } from "components/CourseCard";
import InfiniteScroll from "react-infinite-scroll-component";
import { SearchBar } from "components/SearchBar";
import { useExploreFilters } from "hooks/UseExploreFilters";
import { GetStaticProps } from "next";

interface ExplorePageProps {
  initialCourses?: CourseOutline[];
  totalCoursesCount?: number;
}

export const getStaticProps: GetStaticProps<ExplorePageProps> = async () => {
  try {
    const res = await getData("/outlines/all?limit=100");
    const courses: CourseOutline[] = res.data;
    const totalCoursesCount = res.total_count;

    return {
      props: {
        initialCourses: courses,
        totalCoursesCount: totalCoursesCount,
      },
      revalidate: 86400, // 24 hours
    };
  } catch (error) {
    console.error("Error getting all courses", error);
    return {
      notFound: true,
    };
  }
};

const ExplorePage: React.FC<ExplorePageProps> = ({
  initialCourses,
  totalCoursesCount,
}) => {
  const [courses, setCourses] = useState<CourseOutline[] | undefined>(
    initialCourses || undefined
  );
  const [visibleCourses, setVisibleCourses] = useState<
    CourseOutline[] | undefined
  >([]);
  const [maxVisibleCoursesLength, setMaxVisibleCoursesLength] = useState<
    number | undefined
  >();
  const [sliceIndex, setSliceIndex] = useState(20);
  const [query, setQuery] = useState<string>("");
  const [searchSelected, setSearchSelected] = useState<boolean>(false);
  const CHUNK_SIZE = 20;

  const { subjects, levels, terms, prereqs } = useExploreFilters();

  const loadMore = () => {
    if (!courses) {
      return;
    }

    const filteredCourses = filterCoursesByQuery(courses);
    const nextCourses = filteredCourses.slice(
      sliceIndex,
      sliceIndex + CHUNK_SIZE
    );
    setVisibleCourses((prev) => [...(prev || []), ...nextCourses]);
    setSliceIndex((prev) => prev + CHUNK_SIZE);
  };

  const onFilterChange = () => {
    if (!courses) {
      return;
    }

    const subjectFilteredCourse = filterCourseBySubjects(courses);
    const levelFilteredCourse = filterCoursesByLevels(subjectFilteredCourse);
    const termFilteredCourse = filterCoursesByTerms(levelFilteredCourse);
    const filteredCourses = filterCoursesByQuery(termFilteredCourse);
    const slicedCourses = filteredCourses.slice(0, sliceIndex);

    setMaxVisibleCoursesLength(filteredCourses.length);
    setVisibleCourses(slicedCourses);
    setSliceIndex(CHUNK_SIZE);
  };

  // precondition: defined courses
  const filterCoursesByQuery = (courses: CourseOutline[]) => {
    if (!query) {
      return courses;
    }
    return courses.filter((outline) => {
      const headerText = `${outline.dept} ${outline.number} - ${outline.title} (${outline.units})`;
      const stringArr = [headerText, outline.description];
      const isQuerySubstring = stringArr.some((str) =>
        str.toLowerCase().includes(query.toLowerCase())
      );
      return isQuerySubstring;
    });
  };

  const filterCourseBySubjects = (courses: CourseOutline[]) => {
    if (subjects.selected.length == 0) {
      return courses;
    }

    const selectedSubjectsSet = new Set(subjects.selected);

    return courses.filter((course) => selectedSubjectsSet.has(course.dept));
  };

  const filterCoursesByLevels = (courses: CourseOutline[]) => {
    if (levels.selected.length == 0) {
      return courses;
    }

    const levelsFirstChar = levels.selected.map((level) => +level[0]);
    return courses.filter((course) => {
      const courseLevelFirstChar = +course.number[0];
      return levelsFirstChar.some((level) => {
        if (+level >= 5) {
          return courseLevelFirstChar >= 5;
        }
        return courseLevelFirstChar == level;
      });
    });
  };

  const filterCoursesByTerms = (courses: CourseOutline[]) => {
    if (terms.selected.length == 0) {
      return courses;
    }

    const selectedTermsSet = new Set(terms.selected);

    return courses.filter((course) => {
      return course.terms.some((courseTerm) =>
        selectedTermsSet.has(courseTerm)
      );
    });
  };

  useEffect(onFilterChange, [
    query,
    subjects.selected,
    levels.selected,
    terms.selected,
  ]);

  useEffect(() => {
    if (!courses || !totalCoursesCount || courses.length < totalCoursesCount) {
      loadData("/outlines/all", (res) => {
        totalCoursesCount = res.total_count;
        setCourses(res.data);
      });
    }
    if (courses) {
      setVisibleCourses(courses.slice(0, CHUNK_SIZE));
      setMaxVisibleCoursesLength(courses.length);
    }
  }, [courses]);

  return (
    <div className="page courses-page">
      <Hero title={`explore courses`} backgroundImage={HeroImage.src} />
      <main id="explore-container" className="container">
        <section className="courses-section">
          <SearchBar
            handleInputChange={setQuery}
            searchSelected={searchSelected}
            setSearchSelected={setSearchSelected}
            placeholder="course code, title, or description"
          />
          <p>
            {" "}
            exploring{" "}
            {maxVisibleCoursesLength
              ? numberWithCommas(maxVisibleCoursesLength)
              : "0"}{" "}
            {(maxVisibleCoursesLength || 0) > 1 ? "courses" : "course"}{" "}
          </p>
          {visibleCourses && (
            <InfiniteScroll
              dataLength={visibleCourses.length}
              hasMore={visibleCourses.length < (maxVisibleCoursesLength || 0)}
              loader={<p>Loading...</p>}
              next={loadMore}
              className="courses-container"
            >
              {visibleCourses.map((outline) => (
                <CourseCard
                  key={outline.dept + outline.number}
                  course={outline}
                  query={query}
                />
              ))}
            </InfiniteScroll>
          )}
        </section>
        <section className="filter-section">
          <ExploreFilter
            subjects={subjects}
            levels={levels}
            terms={terms}
            prereqs={prereqs}
          />
        </section>
      </main>
    </div>
  );
};

export default ExplorePage;
