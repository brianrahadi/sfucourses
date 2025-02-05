import {
  ExploreFilter,
  Hero,
  TextBadge,
  CourseCard,
  SearchBar,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { getData, loadData, numberWithCommas } from "@utils";
import { CourseOutline } from "@types";
import InfiniteScroll from "react-infinite-scroll-component";
import { useExploreFilters } from "src/hooks/UseExploreFilters";
import { GetStaticProps } from "next";
import Link from "next/link";
import {
  filterCoursesByQuery,
  filterCourseBySubjects,
  filterCoursesByLevels,
  filterCoursesByTerms,
  filterCoursesByDeliveries,
  filterCoursesByPrereqs,
  filterCoursesByDesignations,
} from "@utils/filters";

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

  const { subjects, levels, terms, prereqs, designations, deliveries } =
    useExploreFilters();

  const loadMore = () => {
    if (!courses) {
      return;
    }

    const filteredCourses = filterCourses(courses);
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
        filterCoursesByTerms(courses, terms.selected),
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

  useEffect(onFilterChange, [
    query,
    subjects.selected,
    levels.selected,
    terms.selected,
    deliveries.selected,
    prereqs.searchQuery,
    prereqs.hasNone,
    designations.selected,
  ]);

  useEffect(() => {
    if (!courses || !totalCoursesCount || courses.length < totalCoursesCount) {
      loadData("/outlines/all", (res: any) => {
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
          <TextBadge
            className="big explore"
            content={`exploring 
            ${
              maxVisibleCoursesLength
                ? numberWithCommas(maxVisibleCoursesLength)
                : "0"
            }
            ${(maxVisibleCoursesLength || 0) > 1 ? "courses" : "course"}`}
          />
          <SearchBar
            handleInputChange={setQuery}
            searchSelected={searchSelected}
            setSearchSelected={setSearchSelected}
            placeholder="course code, title, description, or instructor name"
          />
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
                  showPrereqs={prereqs.isShown}
                  prereqsQuery={prereqs.searchQuery}
                  showInstructors={true}
                />
              ))}
            </InfiniteScroll>
          )}
        </section>
        <section className="filter-section">
          <p className="gray-text right-align">
            Last updated X hours ago -{" "}
            <Link href="https://api.sfucourses.com" className="no-underline">
              api.sfucourses.com
            </Link>
          </p>
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
