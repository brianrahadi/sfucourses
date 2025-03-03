import {
  ExploreFilter,
  Hero,
  TextBadge,
  CourseCard,
  SearchBar,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useState, useEffect } from "react";
import { getCourseAPIData } from "@utils";
import { CourseOutline } from "@types";
import InfiniteScroll from "react-infinite-scroll-component";
import { useExploreFilters } from "src/hooks/UseExploreFilters";
import { GetStaticProps } from "next";
import Link from "next/link";
import { useCoursesData } from "@hooks";
import {
  filterCoursesByQuery,
  filterCourseBySubjects,
  filterCoursesByLevels,
  filterCoursesByOfferedTerms,
  filterCoursesByDeliveries,
  filterCoursesByPrereqs,
  filterCoursesByDesignations,
} from "@utils/courseFilters";
import { numberWithCommas } from "@utils/format";

interface ExplorePageProps {
  initialCourses: CourseOutline[];
  totalCoursesCount: number;
}

// Keep getStaticProps for server-side rendering
export const getStaticProps: GetStaticProps<ExplorePageProps> = async () => {
  try {
    const res = await getCourseAPIData("/outlines/all");
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
  // Use the shared data hook with initial data from SSR
  const { courses, isLoading } = useCoursesData({
    courses: initialCourses,
    totalCount: totalCoursesCount,
  });

  const [visibleCourses, setVisibleCourses] = useState<CourseOutline[]>([]);
  const [maxVisibleCoursesLength, setMaxVisibleCoursesLength] =
    useState<number>(0);
  const [sliceIndex, setSliceIndex] = useState(20);
  const [query, setQuery] = useState<string>("");
  const [searchSelected, setSearchSelected] = useState<boolean>(false);
  const CHUNK_SIZE = 20;

  const { subjects, levels, terms, prereqs, designations, deliveries } =
    useExploreFilters();

  const loadMore = () => {
    if (courses.length === 0) {
      return;
    }

    const filteredCourses = filterCourses(courses);
    const nextCourses = filteredCourses.slice(
      sliceIndex,
      sliceIndex + CHUNK_SIZE
    );
    setVisibleCourses((prev) => [...prev, ...nextCourses]);
    setSliceIndex((prev) => prev + CHUNK_SIZE);
  };

  const onFilterChange = () => {
    if (courses.length === 0) {
      return;
    }

    const filteredCourses = filterCourses(courses);
    const slicedCourses = filteredCourses.slice(0, sliceIndex);

    setMaxVisibleCoursesLength(filteredCourses.length);
    setVisibleCourses(slicedCourses);
    setSliceIndex(CHUNK_SIZE);
  };

  const filterCourses = (courses: CourseOutline[]) => {
    const filteredCourses = [
      (courses: CourseOutline[]) =>
        filterCourseBySubjects(courses, subjects.selected),
      (courses: CourseOutline[]) =>
        filterCoursesByLevels(courses, levels.selected),
      (courses: CourseOutline[]) =>
        filterCoursesByOfferedTerms(courses, terms.selected),
      (courses: CourseOutline[]) =>
        filterCoursesByDeliveries(courses, deliveries.selected),
      (courses: CourseOutline[]) =>
        filterCoursesByDesignations(courses, designations.selected),
      (courses: CourseOutline[]) =>
        filterCoursesByPrereqs(courses, prereqs.searchQuery, prereqs.hasNone),
      (courses: CourseOutline[]) => filterCoursesByQuery(courses, query),
    ].reduce((filtered, filterFunc) => filterFunc(filtered), courses);
    return filteredCourses;
  };

  // Update visible courses when filter changes
  useEffect(onFilterChange, [
    query,
    subjects.selected,
    levels.selected,
    terms.selected,
    deliveries.selected,
    prereqs.searchQuery,
    prereqs.hasNone,
    designations.selected,
    courses, // Re-run when courses data changes
  ]);

  // Initialize visible courses when data is loaded
  useEffect(() => {
    if (courses.length > 0) {
      setVisibleCourses(courses.slice(0, CHUNK_SIZE));
      setMaxVisibleCoursesLength(courses.length);
    }
  }, [courses]);

  if (isLoading && courses.length === 0) {
    return (
      <div className="page courses-page">
        <Hero title={`explore courses`} backgroundImage={HeroImage.src} />
        <main id="explore-container" className="container">
          <div className="center">
            <p>Loading courses...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page courses-page">
      <Hero title={`explore courses`} backgroundImage={HeroImage.src} />
      <main id="explore-container" className="container">
        <section className="courses-section">
          <TextBadge
            className="big explore"
            content={`exploring 
            ${
              maxVisibleCoursesLength
                ? numberWithCommas(maxVisibleCoursesLength)
                : "0"
            }
            ${maxVisibleCoursesLength > 1 ? "courses" : "course"}`}
          />
          <SearchBar
            handleInputChange={setQuery}
            searchSelected={searchSelected}
            setSearchSelected={setSearchSelected}
            placeholder="course code, title, description, or instructor"
          />
          <InfiniteScroll
            dataLength={visibleCourses.length}
            hasMore={visibleCourses.length < maxVisibleCoursesLength}
            loader={<p>Loading...</p>}
            next={loadMore}
            className="courses-container"
          >
            {visibleCourses.map((outline) => (
              <CourseCard
                key={outline.dept + outline.number}
                course={outline}
                query={query}
                showPrereqs={prereqs.isShown}
                prereqsQuery={prereqs.searchQuery}
                showInstructors={true}
              />
            ))}
          </InfiniteScroll>
        </section>
        <section className="filter-section">
          <ExploreFilter
            subjects={subjects}
            levels={levels}
            terms={terms}
            prereqs={prereqs}
            designations={designations}
            deliveries={deliveries}
          />
        </section>
      </main>
    </div>
  );
};

export default ExplorePage;
