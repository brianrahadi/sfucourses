import {
  ExploreFilter,
  Hero,
  TextBadge,
  CourseCard,
  SearchBar,
  Button,
  WeeklySchedule,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useMemo, useState } from "react";
import {
  fetchOutlinesWithSections,
  getCurrentAndNextTerm,
  getData,
  loadData,
  numberWithCommas,
} from "@utils";
import {
  CourseOutline,
  CourseOutlineWithSectionDetails,
  CourseWithSectionDetails,
} from "@types";
import InfiniteScroll from "react-infinite-scroll-component";
import { useExploreFilters } from "src/hooks/UseExploreFilters";
import { GetStaticProps } from "next";
import Link from "next/link";
import { filterCoursesByQuery, filterCoursesByTerms } from "@utils/filters";
import { useTermOfferings } from "src/hooks/UseTermOfferings";
import { useOutlinesWithSections } from "@hooks";

interface ExplorePageProps {
  initialCourses?: CourseOutline[];
  totalCoursesCount?: number;
}

// export const getStaticProps: GetStaticProps<ExplorePageProps> = async () => {
//   try {
//     const res = await getData("/outlines/all?limit=100");
//     const courses: CourseOutline[] = res.data;
//     const totalCoursesCount = res.total_count;

//     return {
//       props: {
//         initialCourses: courses,
//         totalCoursesCount: totalCoursesCount,
//       },
//       revalidate: 86400, // 24 hours
//     };
//   } catch (error) {
//     console.error("Error getting all courses", error);
//     return {
//       notFound: true,
//     };
//   }
// };

const SchedulePage: React.FC<ExplorePageProps> = ({
  initialCourses,
  totalCoursesCount,
}) => {
  const [courses, setCourses] = useState<CourseOutline[] | undefined>(
    initialCourses || undefined
  );
  const [visibleOutlinesWithSections, setVisibleOutlinesWithSections] =
    useState<CourseOutline[] | undefined>([]);
  const [
    maxVisibleOutlinesWithSectionsLength,
    setMaxVisibleOutlinesWithSectionsLength,
  ] = useState<number | undefined>();

  const [sliceIndex, setSliceIndex] = useState(20);
  const [query, setQuery] = useState<string>("");
  const termOptions = useMemo(() => getCurrentAndNextTerm(), []); // Memoize termOptions
  const [isCurrentTerm, setIsCurrentTerm] = useState<boolean>(true);
  const [searchSelected, setSearchSelected] = useState<boolean>(false);
  const CHUNK_SIZE = 20;

  const [outlinesWithSections, setOutlinesWithSections] = useState<
    CourseOutlineWithSectionDetails[]
  >([]);
  // const { outlinesWithSections, isLoading, error } = useOutlinesWithSections(termOptions[isCurrentTerm ? 0 : 1]);

  const loadMore = () => {
    if (!outlinesWithSections) {
      return;
    }

    const filteredCourses = filterCourses(outlinesWithSections);
    const nextCourses = filteredCourses.slice(
      sliceIndex,
      sliceIndex + CHUNK_SIZE
    );
    setVisibleOutlinesWithSections((prev) => [...(prev || []), ...nextCourses]);
    setSliceIndex((prev) => prev + CHUNK_SIZE);
  };

  const onFilterChange = () => {
    if (!outlinesWithSections) {
      return;
    }

    const filteredCourses = filterCourses(outlinesWithSections);
    const slicedCourses = filteredCourses.slice(0, sliceIndex);

    setMaxVisibleOutlinesWithSectionsLength(filteredCourses.length);
    setVisibleOutlinesWithSections(slicedCourses);
    setSliceIndex(CHUNK_SIZE);
  };

  const filterCourses = (courses: CourseOutline[]) => {
    const filteredCourses = [
      (courses: CourseOutline[]) =>
        filterCoursesByTerms(courses, [termOptions[isCurrentTerm ? 0 : 1]]),
      (courses: CourseOutline[]) => filterCoursesByQuery(courses, query),
    ].reduce((filtered, filterFunc) => filterFunc(filtered), courses);
    return filteredCourses;
  };

  useEffect(onFilterChange, [query, isCurrentTerm]);

  useEffect(() => {
    const loadOutlines = async () => {
      const fetchedOutlinesWithSections = await fetchOutlinesWithSections(
        termOptions[isCurrentTerm ? 0 : 1]
      );
      totalCoursesCount = fetchOutlinesWithSections.length;
      setOutlinesWithSections(fetchedOutlinesWithSections);
    };

    if (
      !outlinesWithSections ||
      !totalCoursesCount ||
      outlinesWithSections.length < totalCoursesCount
    ) {
      loadOutlines();
    }
    if (outlinesWithSections) {
      onFilterChange();
    }
  }, [outlinesWithSections]);

  return (
    <div className="page courses-page">
      <Hero title={`schedule courses`} backgroundImage={HeroImage.src} />
      <main id="explore-container" className="container">
        <section className="courses-section">
          <div className="courses-section__header">
            <TextBadge
              className="big explore"
              content={`exploring 
            ${
              maxVisibleOutlinesWithSectionsLength
                ? numberWithCommas(maxVisibleOutlinesWithSectionsLength)
                : "0"
            }
            ${
              (maxVisibleOutlinesWithSectionsLength || 0) > 1
                ? "courses"
                : "course"
            }`}
            />
            <Button
              onClick={() => setIsCurrentTerm(!isCurrentTerm)}
              label={`Switch to ${termOptions[isCurrentTerm ? 1 : 0]}`}
            />
          </div>
          <SearchBar
            handleInputChange={setQuery}
            searchSelected={searchSelected}
            setSearchSelected={setSearchSelected}
            placeholder="course code, title, description, or instructor name"
          />
          {visibleOutlinesWithSections && (
            <InfiniteScroll
              dataLength={visibleOutlinesWithSections.length}
              hasMore={
                visibleOutlinesWithSections.length <
                (maxVisibleOutlinesWithSectionsLength || 0)
              }
              loader={<p>Loading...</p>}
              next={loadMore}
              className="courses-container"
            >
              {outlinesWithSections.map((outline) => (
                <CourseCard
                  key={outline.dept + outline.number}
                  course={outline}
                  query={query}
                  sectionDetails={outline.sections}
                />
              ))}
            </InfiniteScroll>
          )}
        </section>
        <section className="schedule-section">
          <p className="gray-text right-align">
            Last updated X hours ago -{" "}
            <Link href="https://api.sfucourses.com" className="no-underline">
              api.sfucourses.com
            </Link>
          </p>
          <WeeklySchedule />
        </section>
      </main>
    </div>
  );
};

export default SchedulePage;
