import {
  Hero,
  TextBadge,
  CourseCard,
  SearchBar,
  WeeklySchedule,
  CopyLinkButton,
  CopyScheduleButton,
  DownloadCalButton,
  ScheduleManager,
  ConflictFilterButton,
  CompactSelectedCourses,
  ButtonGroup,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useRef, useState } from "react";
import {
  getCourseAPIData,
  getCurrentAndNextTerm,
  loadCourseAPIData,
} from "@utils";
import {
  CourseOutlineWithSectionDetails,
  CourseWithSectionDetails,
  TimeBlock,
} from "@types";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  filterCoursesByQuery,
  filterCoursesByTerm,
} from "@utils/courseFilters";
import { GetStaticProps } from "next";
import { useLocalStorage } from "@hooks";
import { useSearchParams } from "next/navigation";
import { insertUrlParam, removeUrlParameter } from "@utils/url";
import {
  filterCoursesByClassNumbers,
  filterCoursesByCampus,
} from "@utils/courseFilters";
import { numberWithCommas, toTermCode } from "@utils/format";
import {
  filterConflictingCourses,
  filterConflictingCoursesWithOutlines,
} from "@utils/conflictFilter";
import { LuFlower } from "react-icons/lu";
import { BsSun } from "react-icons/bs";
import { MdPlace } from "react-icons/md";
import {
  getTimeBlocksFromUrl,
  timeBlockToCourseFormat,
  updateTimeBlocksInUrl,
} from "@utils/timeBlocks";
import toast from "react-hot-toast";

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
  const [selectedOutlinesWithSections, setSelectedOutlinesWithSections] =
    useState<CourseWithSectionDetails[]>([]);
  const [sliceIndex, setSliceIndex] = useState(20);
  const [query, setQuery] = useState<string>("");
  const termOptions = getCurrentAndNextTerm(); // Memoize termOptions
  const [searchSelected, setSearchSelected] = useState<boolean>(false);
  const [selectedTerm, setSelectedTerm] = useState("");
  const termChangeSource = useRef("initial"); // button or url
  const [hasUserSelectedTerm, setHasUserSelectedTerm] = useState(false);
  const [filterConflicts, setFilterConflicts] = useState(false);
  const [campusFilter, setCampusFilter] = useState("All");

  // Add timeBlocks state for the new feature
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);

  const campusOptions = ["All", "Burnaby", "Surrey", "Vancouver", "Online"];

  const [viewColumns, setViewColumns] = useLocalStorage<
    "Two-column" | "Three-column"
  >("view", "Three-column");

  const searchParams = useSearchParams();

  const CHUNK_SIZE = 20;

  // Load initial time blocks from URL
  useEffect(() => {
    const urlTimeBlocks = getTimeBlocksFromUrl();
    if (urlTimeBlocks.length > 0) {
      setTimeBlocks(urlTimeBlocks);
      // Show notification to user
      toast.success(`Loaded ${urlTimeBlocks.length} time block(s) from URL`);
    }
  }, []);

  // Update URL when time blocks change
  useEffect(() => {
    updateTimeBlocksInUrl(timeBlocks);
  }, [timeBlocks]);

  useEffect(() => {
    if (!hasUserSelectedTerm && termOptions.length > 0) {
      const scheduleSettings = localStorage.getItem("scheduleSettings");

      if (scheduleSettings) {
        try {
          const settings = JSON.parse(scheduleSettings);
          if (
            settings.defaultTerm &&
            termOptions.includes(settings.defaultTerm)
          ) {
            setSelectedTerm(settings.defaultTerm);
          } else {
            setSelectedTerm(termOptions[0]);
          }
        } catch (error) {
          console.error("Error loading schedule settings:", error);
        }
      }
    }
  }, [termOptions, hasUserSelectedTerm]);

  useEffect(() => {
    const termMap = new Map<string, string>();
    termMap.set("sp25", "Spring 2025");
    termMap.set("su25", "Summer 2025");
    termChangeSource.current = "url";

    if (
      searchParams.has("term") &&
      termMap.has(searchParams.get("term") as string)
    ) {
      const key = searchParams.get("term") as string;
      setSelectedTerm(termMap.get(key) as string);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!outlinesWithSections) return;

    const reverseTermMap = new Map<string, string>();
    reverseTermMap.set("Spring 2025", "sp25");
    reverseTermMap.set("Summer 2025", "su25");
    insertUrlParam("term", reverseTermMap.get(selectedTerm) as string);

    if (termChangeSource.current === "initial") {
      return;
    }

    if (termChangeSource.current === "button") {
      setSelectedOutlinesWithSections([]);
      return;
    }
    if (searchParams.has("courses")) {
      const sectionCodes = (searchParams.get("courses") as string).split("-");

      const filteredOutlines = outlinesWithSections.filter(
        (outline) => outline.term === selectedTerm
      );

      setSelectedOutlinesWithSections(
        filterCoursesByClassNumbers(filteredOutlines, sectionCodes)
      );
    }
  }, [searchParams, outlinesWithSections, selectedTerm]);

  useEffect(() => {
    localStorage.setItem("view", viewColumns);
  }, [viewColumns]);

  useEffect(() => {
    if (selectedOutlinesWithSections.length === 0) {
      removeUrlParameter("courses");
      return;
    }
    const sectionCodes = selectedOutlinesWithSections
      .flatMap((course) => course.sections.map((sec) => sec.classNumber))
      .join("-");
    insertUrlParam("courses", sectionCodes);
  }, [selectedOutlinesWithSections]);

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

    let filteredCourses = filterCourses(outlinesWithSections);

    // Apply conflict filter if enabled
    if (filterConflicts) {
      // First filter against selected courses if there are any
      if (selectedOutlinesWithSections.length > 0) {
        filteredCourses = filterConflictingCoursesWithOutlines(
          filteredCourses,
          selectedOutlinesWithSections
        );
      }

      // Then filter against time blocks if there are any
      if (timeBlocks.length > 0) {
        const timeBlocksAsCourses = timeBlocks.map(timeBlockToCourseFormat);
        filteredCourses = filterConflictingCoursesWithOutlines(
          filteredCourses,
          timeBlocksAsCourses
        );
      }
    }

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
      (courses: CourseOutlineWithSectionDetails[]) =>
        filterCoursesByCampus(courses, campusFilter),
    ].reduce((filtered, filterFunc) => filterFunc(filtered), courses);
    return filteredCourses;
  };

  // Re-run filter when any filtering criteria changes or when selected courses change
  useEffect(onFilterChange, [
    query,
    selectedTerm,
    filterConflicts,
    campusFilter,
    selectedOutlinesWithSections,
    timeBlocks, // Add timeBlocks as a dependency to re-filter when blocks change
  ]);

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
            <div className="term-filter-row">
              <div className="filter-with-icon">
                <MdPlace />
                <select
                  className="campus-filter-select"
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                >
                  {campusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <ConflictFilterButton
                isActive={filterConflicts}
                onClick={() => setFilterConflicts(!filterConflicts)}
              />
            </div>
            <div className="flex-row">
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
                onSelect={(value) => {
                  setHasUserSelectedTerm(true); // Mark that user has manually selected a term
                  setSelectedTerm(value);
                }}
                selectedOption={selectedTerm}
              />
            </div>
          </div>
          <div className="search-filter-row">
            <SearchBar
              handleInputChange={setQuery}
              searchSelected={searchSelected}
              setSearchSelected={setSearchSelected}
              placeholder="course code, title, or instructor"
            />
          </div>
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
            <div className="flex-row">
              <CopyLinkButton
                hasSelectedCourses={selectedOutlinesWithSections.length > 0}
              />
              <CopyScheduleButton
                hasSelectedCourses={selectedOutlinesWithSections.length > 0}
              />
              <DownloadCalButton
                coursesWithSections={selectedOutlinesWithSections}
                term={selectedTerm}
              />
            </div>
            <ScheduleManager
              coursesWithSections={selectedOutlinesWithSections}
              setCoursesWithSections={setSelectedOutlinesWithSections}
              selectedTerm={selectedTerm}
              setSelectedTerm={(term) => {
                setHasUserSelectedTerm(true); // Mark that user has manually selected a term
                setSelectedTerm(term);
              }}
              termOptions={termOptions}
            />
            {/* <ButtonGroup
              className="view-column-button-group"
              options={["Two-column", "Three-column"]}
              onSelect={setViewColumns}
              selectedOption={viewColumns}
            /> */}
          </div>
          <div className="schedule-features-hint">
            <p>
              <strong>New!</strong> Drag on the calendar to block off time
              slots. Blocked times will be saved in your shared schedule link.
            </p>
          </div>
          <div className="schedule-section__content">
            <CompactSelectedCourses
              selectedCourses={selectedOutlinesWithSections}
              onRemoveCourse={(course, classNumber) => {
                setSelectedOutlinesWithSections((prev) => {
                  return prev
                    .flatMap((c) => {
                      if (c.dept + c.number !== course.dept + course.number) {
                        return c;
                      }

                      const updatedSections = c.sections.filter(
                        (section) => section.classNumber !== classNumber
                      );

                      if (updatedSections.length === 0) {
                        return [];
                      }

                      return {
                        ...c,
                        sections: updatedSections,
                      };
                    })
                    .filter(Boolean);
                });
              }}
              term={selectedTerm}
            />
            <div className="schedule-container">
              <WeeklySchedule
                coursesWithSections={selectedOutlinesWithSections}
                setCoursesWithSections={setSelectedOutlinesWithSections}
                timeBlocks={timeBlocks}
                setTimeBlocks={setTimeBlocks}
              />
              <div className="schedule-container__bottom">
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
          </div>
        </section>
      </main>
    </div>
  );
};

export default SchedulePage;
