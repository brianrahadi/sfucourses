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
  getCourseAPIData,
  getCurrentAndNextTerm,
  loadCourseAPIData,
  numberWithCommas,
  toTermCode,
} from "@utils";
import { CourseOutlineWithSectionDetails } from "@types";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";
import { filterCoursesByQuery, filterCoursesByTerm } from "@utils/filters";
import { GetStaticProps } from "next";

interface SchedulePageProps {
  initialSections?: CourseOutlineWithSectionDetails[];
}

export const getStaticProps: GetStaticProps<SchedulePageProps> = async () => {
  try {
    const terms = getCurrentAndNextTerm();
    const termCodes = terms.map(toTermCode);
    const currentTermSections = await getCourseAPIData(
      `/sections/${termCodes[0]}?withOutlines=true`
    );
    const nextTermSections = await getCourseAPIData(
      `/sections/${termCodes[1]}?withOutlines=true`
    );

    return {
      props: {
        initialSections: [...currentTermSections, ...nextTermSections],
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

const SchedulePage: React.FC<SchedulePageProps> = ({ initialSections }) => {
  const [outlinesWithSections, setOutlinesWithSections] = useState<
    CourseOutlineWithSectionDetails[] | undefined
  >(initialSections || undefined);
  const [visibleOutlinesWithSections, setVisibleOutlinesWithSections] =
    useState<CourseOutlineWithSectionDetails[] | undefined>([]);
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

  const filterCourses = (courses: CourseOutlineWithSectionDetails[]) => {
    const filteredCourses = [
      (courses: CourseOutlineWithSectionDetails[]) =>
        filterCoursesByTerm(courses, termOptions[isCurrentTerm ? 0 : 1]),
      (courses: CourseOutlineWithSectionDetails[]) =>
        filterCoursesByQuery(courses, query),
    ].reduce((filtered, filterFunc) => filterFunc(filtered), courses);
    return filteredCourses;
  };

  useEffect(onFilterChange, [query, isCurrentTerm]);

  useEffect(() => {
    if (!outlinesWithSections) {
      loadCourseAPIData(
        `/sections/${toTermCode(
          termOptions[isCurrentTerm ? 0 : 1]
        )}?withOutlines=true`,
        (res: any) => {
          setOutlinesWithSections((prev) => {
            if (prev) {
              return [...prev, ...res];
            }
            return res;
          });
        }
      );

      loadCourseAPIData(
        `/sections/${toTermCode(
          termOptions[isCurrentTerm ? 1 : 0]
        )}?withOutlines=true`,
        (res: any) => {
          setOutlinesWithSections((prev) => {
            if (prev) {
              return [...prev, ...res];
            }
            return res;
          });
        }
      );
    }
    if (outlinesWithSections) {
      setVisibleOutlinesWithSections(outlinesWithSections.slice(0, CHUNK_SIZE));
      setMaxVisibleOutlinesWithSectionsLength(outlinesWithSections.length);
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
              {visibleOutlinesWithSections.map((outline) => (
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
