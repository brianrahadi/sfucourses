import {
  ExploreFilter,
  Hero,
  TextBadge,
  CourseCard,
  SearchBar,
  Button,
  WeeklySchedule,
  ButtonGroup,
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
import {
  CourseOutlineWithSectionDetails,
  CourseWithSectionDetails,
} from "@types";
import InfiniteScroll from "react-infinite-scroll-component";
import Link from "next/link";
import { filterCoursesByQuery, filterCoursesByTerm } from "@utils/filters";
import { GetStaticProps } from "next";
import { useLocalStorage } from "@hooks";
import { useSearchParams } from "next/navigation";

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

// function updateJsonUrlParam(key: text: string): void {
//   if (!text) {
//     // removeUrlParameter(JSON_QUERY_PARAM); // remove query param if text is empty
//   } else {
//     insertUrlParam()
//     // const encodedText: string = compressToEncodedURIComponent(text);
//     // if (encodedText.length <= MAX_QUERY_PARAM_LENGTH) {
//     //   //TODO: validate raw test instead of parsed text?
//     //   insertUrlParam(JSON_QUERY_PARAM, encodedText);
//     // } else {
//     //   removeUrlParameter(JSON_QUERY_PARAM);
//     // }
//   }
// }

function insertUrlParam(key: string, value: string): void {
  if (window.history.pushState) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set(key, value);
    const newUrl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname +
      "?" +
      searchParams.toString();
    window.history.pushState({ path: newUrl }, "", newUrl);
  }
}

// function decodeUrlParam(param: string | null): string | undefined {
//   return param ? param : undefined;
// }

// function removeUrlParameter(paramKey: string) {
//   const url = window.location.href;
//   const urlObject = new URL(url);
//   urlObject.searchParams.delete(paramKey);
//   const newUrl = urlObject.href;
//   window.history.pushState({ path: newUrl }, "", newUrl);
// }

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
  const [selectedOutlinesWithSections, setSelectedOutlinesWithSections] =
    useState<CourseWithSectionDetails[]>([]);
  const [sliceIndex, setSliceIndex] = useState(20);
  const [query, setQuery] = useState<string>("");
  const termOptions = getCurrentAndNextTerm(); // Memoize termOptions
  const [searchSelected, setSearchSelected] = useState<boolean>(false);
  const [selectedTerm, setSelectedTerm] = useLocalStorage(
    "selectedTerm",
    termOptions[0]
  );
  const [viewColumns, setViewColumns] = useLocalStorage<
    "Two-column" | "Three-column"
  >("viewColumns", "Three-column");

  const initialQueryParams = useSearchParams();

  const CHUNK_SIZE = 20;

  useEffect(() => {
    const termMap = new Map<string, string>();
    termMap.set("sp25", "Spring 2025");
    termMap.set("su25", "Summer 2025");

    if (
      initialQueryParams.has("term") &&
      termMap.has(initialQueryParams.get("term") as string)
    ) {
      const key = initialQueryParams.get("term") as string;
      setSelectedTerm(termMap.get(key) as string);
    }
  }, [initialQueryParams]);

  // Update localStorage when selectedTerm changes
  useEffect(() => {
    const reverseTermMap = new Map<string, string>();
    reverseTermMap.set("Spring 2025", "sp25");
    reverseTermMap.set("Summer 2025", "su25");

    localStorage.setItem("selectedTerm", selectedTerm);
    insertUrlParam("term", reverseTermMap.get(selectedTerm) as string);
  }, [selectedTerm]);

  // Update localStorage when viewColumns changes
  useEffect(() => {
    localStorage.setItem("viewColumns", viewColumns);
  }, [viewColumns]);

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
        filterCoursesByTerm(courses, selectedTerm),
      (courses: CourseOutlineWithSectionDetails[]) =>
        filterCoursesByQuery(courses, query),
    ].reduce((filtered, filterFunc) => filterFunc(filtered), courses);
    return filteredCourses;
  };

  useEffect(onFilterChange, [query, selectedTerm]);

  useEffect(() => {
    setSelectedOutlinesWithSections([]);
  }, [selectedTerm]);

  useEffect(() => {
    if (!outlinesWithSections) {
      loadCourseAPIData(
        `/sections/${toTermCode(selectedTerm)}?withOutlines=true`,
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
        `/sections/${toTermCode(selectedTerm)}?withOutlines=true`,
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
      <Hero title="schedule courses" backgroundImage={HeroImage.src} />
      <main
        id="schedule-container"
        className={`container ${viewColumns === "Two-column" && "two-column"}`}
      >
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
            <ButtonGroup
              options={termOptions}
              onSelect={setSelectedTerm}
              selectedOption={selectedTerm}
            />
          </div>
          <SearchBar
            handleInputChange={setQuery}
            searchSelected={searchSelected}
            setSearchSelected={setSearchSelected}
            placeholder="course code, title, or instructor"
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
                  sectionDetails={outline}
                  showDescription={false}
                  isLink={false}
                  setOfferings={{
                    fn: setSelectedOutlinesWithSections,
                    type: "ADD",
                  }}
                />
              ))}
            </InfiniteScroll>
          )}
        </section>
        <section className="schedule-section">
          <div className="schedule-section__header">
            <ButtonGroup
              className="view-column-button-group"
              options={["Two-column", "Three-column"]}
              onSelect={setViewColumns}
              selectedOption={viewColumns}
            />
          </div>
          <div className="schedule-section__content">
            <div className="selected-courses">
              <h3 className="section-title">Selected Courses</h3>

              <div className="selected-courses__items">
                {selectedOutlinesWithSections.map((outline) => (
                  <CourseCard
                    key={"selected" + outline.dept + outline.number}
                    course={outline as any}
                    query={query}
                    sectionDetails={outline}
                    showDescription={false}
                    isLink={false}
                    setOfferings={{
                      fn: setSelectedOutlinesWithSections,
                      type: "REMOVE",
                    }}
                    type="SELECTED_COURSES"
                  />
                ))}
              </div>
            </div>
            <div className="schedule-container">
              <WeeklySchedule
                coursesWithSections={selectedOutlinesWithSections}
                setCoursesWithSections={setSelectedOutlinesWithSections}
              />
              <div className="selected-courses-badges">
                {selectedOutlinesWithSections.map((outline) => (
                  <TextBadge
                    key={`badge ${outline.dept} ${outline.number}`}
                    content={`${outline.dept} ${outline.number}`}
                    enableBgColor
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SchedulePage;
