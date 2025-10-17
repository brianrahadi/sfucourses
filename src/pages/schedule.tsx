import {
  Hero,
  TextBadge,
  ScheduleCourseCard,
  SearchBar,
  WeeklySchedule,
  CopyLinkButton,
  CopyScheduleButton,
  DownloadCalButton,
  ScheduleManager,
  CompactSelectedCourses,
  ButtonGroup,
  SidebarCourse,
  FilterDialog,
  ResetFilterButton,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useRef, useState } from "react";
import {
  getCourseAPIData,
  getCurrentAndNextTerm,
  toShortenedTerm,
  loadCourseAPIData,
} from "@utils";
import {
  CourseOutline,
  CourseOutlineWithSectionDetails,
  CourseWithSectionDetails,
  TimeBlock,
} from "@types";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  filterCoursesByQuery,
  filterCoursesByTerm,
  filterCoursesByClassNumbers,
  filterCoursesByCampus,
  filterCoursesByDays,
  filterCoursesByTime,
  filterCoursesBySubjectsWithSections,
  filterCoursesByLevelsWithSections,
} from "@utils/courseFilters";
import { GetStaticProps } from "next";
import { useSearchParams } from "next/navigation";
import { insertUrlParam, removeUrlParameter } from "@utils/url";
import { numberWithCommas, toTermCode } from "@utils/format";
import { filterConflictingCoursesWithOutlines } from "@utils/conflictFilter";
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
      `/sections?term=${termCodes[0]}`
    );
    const nextTermSections = await getCourseAPIData(
      `/sections?term=${termCodes[1]}`
    );

    return {
      props: {
        initialSections: [...currentTermSections, ...nextTermSections],
      },
      revalidate: 60 * 60 * 24, // hourly
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
  const [selectedTerm, setSelectedTerm] = useState(termOptions[1]);
  const termChangeSource = useRef("initial"); // button or url
  const [hasUserSelectedTerm, setHasUserSelectedTerm] = useState(false);
  const [filterConflicts, setFilterConflicts] = useState(false);
  const [campusFilter, setCampusFilter] = useState<string[]>([]);
  const [daysFilter, setDaysFilter] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [currentTerm, nextTerm] = getCurrentAndNextTerm();

  // Check if any filters are applied
  const hasFiltersApplied =
    filterConflicts ||
    campusFilter.length > 0 ||
    daysFilter.length > 0 ||
    timeFilter.start !== "" ||
    timeFilter.end !== "" ||
    subjectFilter.length > 0 ||
    levelFilter.length > 0;

  // Clear all filters function
  const clearAllFilters = () => {
    setFilterConflicts(false);
    setCampusFilter([]);
    setDaysFilter([]);
    setTimeFilter({ start: "", end: "" });
    setSubjectFilter([]);
    setLevelFilter([]);
  };

  // Keyboard shortcuts for schedule page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "f":
          e.preventDefault();
          const filterButton = document.querySelector(
            "[data-filter-button]"
          ) as HTMLButtonElement;
          if (filterButton) {
            filterButton.click();
          }
          break;
        case "r":
          e.preventDefault();
          if (hasFiltersApplied) {
            clearAllFilters();
          }
          break;
        case "s":
          e.preventDefault();
          const searchInput = document.querySelector(
            'input[placeholder*="course code"]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;
        case "t":
          e.preventDefault();
          const currentIndex = termOptions.indexOf(selectedTerm);
          const nextIndex = (currentIndex + 1) % termOptions.length;
          termChangeSource.current = "keyboard";
          setHasUserSelectedTerm(true);
          setSelectedTerm(termOptions[nextIndex]);
          setTimeBlocks([]);
          setSelectedOutlinesWithSections([]);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasFiltersApplied, clearAllFilters]);
  const [previewCourse, setPreviewCourse] =
    useState<CourseWithSectionDetails | null>(null);
  const [hoveredCourse, setHoveredCourse] = useState<
    CourseOutline | CourseOutlineWithSectionDetails | null
  >(null);
  const [pinnedCourse, setPinnedCourse] = useState<
    CourseOutline | CourseOutlineWithSectionDetails | null
  >(null);
  const [courseDetails, setCourseDetails] =
    useState<CourseWithSectionDetails | null>(null);

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);

  const searchParams = useSearchParams();

  const CHUNK_SIZE = 20;

  useEffect(() => {
    const urlTimeBlocks = getTimeBlocksFromUrl();
    if (urlTimeBlocks.length > 0) {
      setTimeBlocks(urlTimeBlocks);
      // Show notification to user
      toast.success(`Loaded ${urlTimeBlocks.length} time block(s) from URL`);
    }
  }, []);

  useEffect(() => {
    updateTimeBlocksInUrl(timeBlocks);
  }, [timeBlocks]);

  useEffect(() => {
    const termMap = new Map<string, string>();
    termMap.set(toShortenedTerm(currentTerm), currentTerm);
    termMap.set(toShortenedTerm(nextTerm), nextTerm);
    termChangeSource.current = "url";

    if (
      searchParams.has("term") &&
      termMap.has(searchParams.get("term") as string)
    ) {
      const key = searchParams.get("term") as string;
      const newTerm = termMap.get(key) as string;
      if (newTerm !== selectedTerm) {
        setTimeBlocks([]);
      }
      setSelectedTerm(newTerm);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!outlinesWithSections) return;

    const reverseTermMap = new Map<string, string>();
    reverseTermMap.set(currentTerm, toShortenedTerm(currentTerm));
    reverseTermMap.set(nextTerm, toShortenedTerm(nextTerm));
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
        filterCoursesBySubjectsWithSections(courses, subjectFilter),
      (courses: CourseOutlineWithSectionDetails[]) =>
        filterCoursesByLevelsWithSections(courses, levelFilter),
      (courses: CourseOutlineWithSectionDetails[]) =>
        filterCoursesByCampus(courses, campusFilter),
      (courses: CourseOutlineWithSectionDetails[]) =>
        filterCoursesByDays(courses, daysFilter),
      (courses: CourseOutlineWithSectionDetails[]) =>
        filterCoursesByTime(courses, timeFilter),
    ].reduce((filtered, filterFunc) => filterFunc(filtered), courses);
    return filteredCourses;
  };

  // Re-run filter when any filtering criteria changes or when selected courses change
  useEffect(onFilterChange, [
    query,
    selectedTerm,
    filterConflicts,
    campusFilter,
    daysFilter,
    timeFilter,
    subjectFilter,
    levelFilter,
    selectedOutlinesWithSections,
    timeBlocks, // Add timeBlocks as a dependency to re-filter when blocks change
  ]);

  useEffect(() => {
    if (!outlinesWithSections) {
      loadCourseAPIData(
        `/sections?term=${toTermCode(selectedTerm)}`,
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
        `/sections?term=${toTermCode(selectedTerm)}`,
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

  const InfiniteScrollCourses = (
    visibleOutlinesWithSections: CourseOutlineWithSectionDetails[],
    maxVisibleOutlinesWithSectionsLength: number,
    setCourseDetails: (course: CourseOutlineWithSectionDetails) => void
  ) => {
    return (
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
          <ScheduleCourseCard
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
            previewCourse={previewCourse}
            setPreviewCourse={setPreviewCourse}
            onCourseHover={(course) =>
              setHoveredCourse(course as CourseOutlineWithSectionDetails)
            }
            onCourseClick={(course) =>
              setPinnedCourse(course as CourseOutlineWithSectionDetails)
            }
            setCourseDetails={() =>
              setCourseDetails(outline as CourseOutlineWithSectionDetails)
            }
          />
        ))}
      </InfiniteScroll>
    );
  };

  return (
    <div className="page courses-page">
      <Hero title="schedule courses" backgroundImage={HeroImage.src} />
      <main id="schedule-container" className="container">
        <section className="courses-section">
          <div className="courses-section__header">
            <div className="term-filter-row">
              <FilterDialog
                campusFilter={campusFilter}
                setCampusFilter={setCampusFilter}
                filterConflicts={filterConflicts}
                setFilterConflicts={setFilterConflicts}
                daysFilter={daysFilter}
                setDaysFilter={setDaysFilter}
                timeFilter={timeFilter}
                setTimeFilter={setTimeFilter}
                subjectFilter={subjectFilter}
                setSubjectFilter={setSubjectFilter}
                levelFilter={levelFilter}
                setLevelFilter={setLevelFilter}
              />
              <ResetFilterButton
                hasFiltersApplied={hasFiltersApplied}
                onResetFilters={clearAllFilters}
              />
            </div>
            <div className="flex-row">
              <TextBadge
                className="big explore gray-text"
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
                  termChangeSource.current = "button";
                  setHasUserSelectedTerm(true); // Mark that user has manually selected a term
                  setSelectedTerm(value);
                  setTimeBlocks([]);
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
          {courseDetails ? (
            <SidebarCourse
              course={courseDetails}
              onClose={() => setCourseDetails(null)}
            />
          ) : visibleOutlinesWithSections ? (
            InfiniteScrollCourses(
              visibleOutlinesWithSections,
              maxVisibleOutlinesWithSectionsLength || 0,
              setCourseDetails
            )
          ) : (
            <p>No courses found</p>
          )}
        </section>
        <section className="schedule-section">
          <div className="schedule-section__header">
            <ScheduleManager
              coursesWithSections={selectedOutlinesWithSections}
              setCoursesWithSections={setSelectedOutlinesWithSections}
              timeBlocks={timeBlocks}
              setTimeBlocks={setTimeBlocks}
              selectedTerm={selectedTerm}
            />
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
                previewCourse={previewCourse}
              />
            </div>
          </div>
        </section>
      </main>
      {(hoveredCourse || pinnedCourse) && (
        <SidebarCourse
          course={(hoveredCourse || pinnedCourse)!}
          onClose={() => {
            setPinnedCourse(null);
            setHoveredCourse(null);
          }}
          isPinned={!!pinnedCourse && !hoveredCourse}
        />
      )}
    </div>
  );
};

export default SchedulePage;
