// pages/explore/index.tsx
import {
  ExploreFilter,
  Hero,
  TextBadge,
  ExploreCourseCard,
  SearchBar,
  InstructorCard,
  InstructorExploreFilter,
  ButtonGroup,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useState, useEffect, useRef, useMemo } from "react";
import { CourseOutline, Instructor } from "@types";

interface InstructorReviewSummary {
  URL: string;
  Quality: string;
  Ratings: string;
  Name: string;
  WouldTakeAgain: string;
  Difficulty: string;
  Department: string;
}

interface CourseReviewSummary {
  course_code: string;
  total_reviews: number;
  avg_rating: number;
  avg_difficulty: number;
}
import InfiniteScroll from "react-infinite-scroll-component";
import { useExploreFilters, SortState } from "src/hooks/UseExploreFilters";
import { useInstructorExploreFilters } from "@hooks";
import { GetStaticProps } from "next";
import { useQuery } from "@tanstack/react-query";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { getCourseAPIData } from "@utils";
import {
  filterCoursesByQuery,
  filterCourseBySubjects,
  filterCoursesByLevels,
  filterCoursesByOfferedTerms,
  filterCoursesByDeliveries,
  filterCoursesByPrereqs,
  filterCoursesByDesignations,
  filterCoursesByReviews,
} from "@utils/courseFilters";
import { numberWithCommas } from "@utils/format";
import { RotatingLines } from "react-loader-spinner";
import { SelectInstance } from "react-select";
import { BASE_URL } from "@const";

export const getStaticProps: GetStaticProps = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["allCourses"],
    queryFn: async () => {
      const res = await getCourseAPIData("/outlines");
      return res as CourseOutline[];
    },
  });

  await queryClient.prefetchQuery({
    queryKey: ["allInstructors"],
    queryFn: async () => {
      const res = await getCourseAPIData("/instructors");
      return res as Instructor[];
    },
  });

  await queryClient.prefetchQuery({
    queryKey: ["instructorReviews"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/reviews/instructors`);
      return res.json() as Promise<InstructorReviewSummary[]>;
    },
  });

  await queryClient.prefetchQuery({
    queryKey: ["courseReviews"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/reviews/courses`);
      return res.json() as Promise<CourseReviewSummary[]>;
    },
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    revalidate: 60 * 60 * 24, // daily
  };
};

const ExplorePage: React.FC = () => {
  // Course data and logic
  const { data: courseData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["allCourses"],
    queryFn: async () => {
      const res = await getCourseAPIData("/outlines");
      return res as CourseOutline[];
    },
    staleTime: 60 * 60 * 1000,
  });
  const { data: instructorData, isLoading: isLoadingInstructors } = useQuery({
    queryKey: ["allInstructors"],
    queryFn: async () => {
      const res = await getCourseAPIData("/instructors");
      return res as Instructor[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const { data: instructorReviewsData, isLoading: isLoadingReviews } = useQuery(
    {
      queryKey: ["instructorReviews"],
      queryFn: async () => {
        const res = await fetch(`${BASE_URL}/reviews`);
        return res.json() as Promise<InstructorReviewSummary[]>;
      },
      staleTime: 60 * 60 * 1000,
    }
  );

  const { data: courseReviewsData, isLoading: isLoadingCourseReviews } =
    useQuery({
      queryKey: ["courseReviews"],
      queryFn: async () => {
        const res = await fetch(`${BASE_URL}/reviews/courses`);
        return res.json() as Promise<CourseReviewSummary[]>;
      },
      staleTime: 60 * 60 * 1000,
    });

  const courses = courseData || [];
  const [visibleCourses, setVisibleCourses] = useState<CourseOutline[]>([]);
  const [maxVisibleCoursesLength, setMaxVisibleCoursesLength] =
    useState<number>(0);
  const [courseSliceIndex, setCourseSliceIndex] = useState(20);
  const instructors = instructorData || [];
  const [visibleInstructors, setVisibleInstructors] = useState<Instructor[]>(
    []
  );
  const [maxVisibleInstructors, setMaxVisibleInstructors] = useState<number>(0);
  const [instructorSliceIndex, setInstructorSliceIndex] = useState(20);

  // Shared state
  const [query, setQuery] = useState<string>("");
  const [searchSelected, setSearchSelected] = useState<boolean>(false);
  const [mode, setMode] = useState<"courses" | "instructors">("courses");
  const CHUNK_SIZE = 20;

  const courseFilters = useExploreFilters();
  const instructorFilters = useInstructorExploreFilters();

  const colourNeutral1000 = "#323434";
  const colourNeutral900 = "#4b4e4d";
  const colourNeutral800 = "#646867";
  const sortSelectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: colourNeutral1000,
      border: 0,
      borderColor: colourNeutral800,
      color: "#fff",
      minWidth: "150px",
      minHeight: "3rem",
      // height: "3rem",
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "0.5rem 0.75rem",
      height: "100%",
      display: "flex",
      alignItems: "center",
    }),
    input: (base: any) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: "#fff",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: colourNeutral1000,
      color: "#fff",
      zIndex: 9999,
      marginTop: "0.25rem",
    }),
    menuList: (base: any) => ({
      ...base,
      padding: "0.25rem 0",
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? colourNeutral900 : colourNeutral1000,
      cursor: "pointer",
      padding: "0.5rem 0.75rem",
      minHeight: "2.5rem",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "#fff",
      margin: 0,
      lineHeight: "normal",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#9ca3af",
      margin: 0,
      lineHeight: "normal",
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      paddingRight: "0.5rem",
      height: "100%",
      display: "flex",
      alignItems: "center",
    }),
  };

  const sortOptions = [
    { value: "reviews-asc", label: "Reviews ↑" },
    { value: "reviews-desc", label: "Reviews ↓" },
    { value: "rating-asc", label: "Rating ↑" },
    { value: "rating-desc", label: "Rating ↓" },
    { value: "difficulty-asc", label: "Difficulty ↑" },
    { value: "difficulty-desc", label: "Difficulty ↓" },
  ];

  // Get review data for a specific instructor
  const getInstructorReviewData = (
    instructorName: string
  ): InstructorReviewSummary | null => {
    if (!instructorReviewsData) return null;
    return (
      instructorReviewsData.find(
        (review) => review.Name.toLowerCase() === instructorName.toLowerCase()
      ) || null
    );
  };

  // Get review data for a specific course
  const getCourseReviewData = (
    courseCode: string
  ): CourseReviewSummary | null => {
    if (!courseReviewsData) return null;
    return (
      courseReviewsData.find(
        (review) =>
          review.course_code.toLowerCase() === courseCode.toLowerCase()
      ) || null
    );
  };

  // Create a lookup map for course review data to optimize sorting
  const courseReviewMap = useMemo(() => {
    if (!courseReviewsData) return new Map<string, CourseReviewSummary>();
    const map = new Map<string, CourseReviewSummary>();
    courseReviewsData.forEach((review) => {
      map.set(review.course_code.toLowerCase(), review);
    });
    return map;
  }, [courseReviewsData]);

  // Keyboard shortcuts for explore page
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
        case "s":
          e.preventDefault();
          // Focus on search bar
          const searchInput = document.querySelector(
            'input[placeholder*="course"]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;
        case "c":
          e.preventDefault();
          // Switch to courses mode
          if (mode !== "courses") {
            setMode("courses");
            courseFilters.onReset();
            instructorFilters.onReset();
          }
          break;
        case "i":
          e.preventDefault();
          // Switch to instructors mode
          if (mode !== "instructors") {
            setMode("instructors");
            courseFilters.onReset();
            instructorFilters.onReset();
          }
          break;
        case "r":
          e.preventDefault();
          // Reset all filters
          courseFilters.onReset();
          instructorFilters.onReset();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mode, courseFilters, instructorFilters]);

  const filterCourses = (courses: CourseOutline[]) => {
    const filteredCourses = [
      (courses: CourseOutline[]) =>
        filterCourseBySubjects(courses, courseFilters.subjects.selected),
      (courses: CourseOutline[]) =>
        filterCoursesByLevels(courses, courseFilters.levels.selected),
      (courses: CourseOutline[]) =>
        filterCoursesByOfferedTerms(courses, courseFilters.terms.selected),
      (courses: CourseOutline[]) =>
        filterCoursesByDeliveries(courses, courseFilters.deliveries.selected),
      (courses: CourseOutline[]) =>
        filterCoursesByDesignations(
          courses,
          courseFilters.designations.selected
        ),
      (courses: CourseOutline[]) =>
        filterCoursesByPrereqs(
          courses,
          courseFilters.prereqs.searchQuery,
          courseFilters.prereqs.hasNone
        ),
      (courses: CourseOutline[]) =>
        filterCoursesByReviews(
          courses,
          courseFilters.reviews.minReviews,
          courseReviewMap
        ),
      (courses: CourseOutline[]) => filterCoursesByQuery(courses, query),
    ].reduce((filtered, filterFunc) => filterFunc(filtered), courses);
    return filteredCourses;
  };

  const sortCourses = (courses: CourseOutline[]) => {
    const sortValue = courseFilters.sort.value;

    if (!sortValue) return courses;

    const [field, direction] = sortValue.split("-");
    const isAsc = direction === "asc";
    const sortedCourses = [...courses];

    sortedCourses.sort((a, b) => {
      const courseCodeA = `${a.dept}${a.number}`.toLowerCase();
      const courseCodeB = `${b.dept}${b.number}`.toLowerCase();
      const reviewA = courseReviewMap.get(courseCodeA);
      const reviewB = courseReviewMap.get(courseCodeB);

      let valueA = 0;
      let valueB = 0;

      if (field === "reviews") {
        valueA = reviewA?.total_reviews || 0;
        valueB = reviewB?.total_reviews || 0;
      } else if (field === "rating") {
        valueA = reviewA?.avg_rating || 0;
        valueB = reviewB?.avg_rating || 0;
      } else if (field === "difficulty") {
        valueA = reviewA?.avg_difficulty || 0;
        valueB = reviewB?.avg_difficulty || 0;
      }

      return isAsc ? valueA - valueB : valueB - valueA;
    });

    return sortedCourses;
  };

  const filterInstructors = (instructors: Instructor[]) => {
    const filtered = [
      (instructors: Instructor[]) =>
        instructorFilters.subjects.selected.length > 0
          ? instructors.filter((instructor) =>
              instructor.offerings.some((offering) =>
                instructorFilters.subjects.selected.includes(offering.dept)
              )
            )
          : instructors,
      (instructors: Instructor[]) =>
        instructorFilters.terms.selected.length > 0
          ? instructors.filter((instructor) =>
              instructor.offerings.some((offering) =>
                instructorFilters.terms.selected.some((term) =>
                  offering.term.toLowerCase().includes(term.toLowerCase())
                )
              )
            )
          : instructors,
      (instructors: Instructor[]) =>
        query
          ? instructors.filter(
              (instructor) =>
                instructor.name.toLowerCase().includes(query.toLowerCase()) ||
                instructor.offerings.some((offering) =>
                  `${offering.dept} ${offering.number}`
                    .toLowerCase()
                    .includes(query.toLowerCase())
                )
            )
          : instructors,
    ].reduce((filtered, filterFunc) => filterFunc(filtered), instructors);
    return filtered;
  };

  // Handlers for loading more
  const loadMoreCourses = () => {
    if (courses.length === 0) return;
    const filtered = filterCourses(courses);
    const sorted = sortCourses(filtered);
    const next = sorted.slice(courseSliceIndex, courseSliceIndex + CHUNK_SIZE);
    setVisibleCourses((prev) => [...prev, ...next]);
    setCourseSliceIndex((prev) => prev + CHUNK_SIZE);
  };
  const loadMoreInstructors = () => {
    if (instructors.length === 0) return;
    const filtered = filterInstructors(instructors);
    const next = filtered.slice(
      instructorSliceIndex,
      instructorSliceIndex + CHUNK_SIZE
    );
    setVisibleInstructors((prev) => [...prev, ...next]);
    setInstructorSliceIndex((prev) => prev + CHUNK_SIZE);
  };

  // Effect: update visible courses when filters change
  useEffect(() => {
    if (mode !== "courses") return;
    if (courses.length === 0) return;
    const filtered = filterCourses(courses);
    const sorted = sortCourses(filtered);
    setMaxVisibleCoursesLength(sorted.length);
    setVisibleCourses(sorted.slice(0, CHUNK_SIZE));
    setCourseSliceIndex(CHUNK_SIZE);
  }, [
    query,
    courseFilters.subjects.selected,
    courseFilters.levels.selected,
    courseFilters.terms.selected,
    courseFilters.deliveries.selected,
    courseFilters.prereqs.searchQuery,
    courseFilters.prereqs.hasNone,
    courseFilters.designations.selected,
    courseFilters.reviews.minReviews,
    courseFilters.sort.value,
    courses,
    mode,
    courseReviewsData,
  ]);

  // Effect: update visible instructors when filters change
  useEffect(() => {
    if (mode !== "instructors") return;
    if (instructors.length === 0) return;
    const filtered = filterInstructors(instructors);
    setMaxVisibleInstructors(filtered.length);
    setVisibleInstructors(filtered.slice(0, CHUNK_SIZE));
    setInstructorSliceIndex(CHUNK_SIZE);
  }, [
    query,
    instructorFilters.subjects.selected,
    instructorFilters.terms.selected,
    instructors,
    mode,
  ]);

  // Loading state
  if (
    (mode === "courses" && isLoadingCourses && courses.length === 0) ||
    (mode === "instructors" && isLoadingInstructors && instructors.length === 0)
  ) {
    return (
      <div className="page courses-page">
        <Hero title={`explore ${mode}`} backgroundImage={HeroImage.src} />
        <main id="explore-container" className="container">
          <div className="center">
            <RotatingLines visible={true} strokeColor="#24a98b" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page courses-page">
      <Hero title={`explore ${mode}`} backgroundImage={HeroImage.src} />
      <main id="explore-container" className="container">
        <section className="courses-section">
          <div className="courses-section__explore-header">
            <div className="courses-section__explore-header__left">
              <TextBadge
                className="big explore gray-text"
                content={`${
                  mode === "courses"
                    ? maxVisibleCoursesLength
                      ? numberWithCommas(maxVisibleCoursesLength)
                      : "0"
                    : maxVisibleInstructors
                    ? numberWithCommas(maxVisibleInstructors)
                    : "0"
                } found`}
              />
              <ButtonGroup
                options={["courses", "instructors"]}
                onSelect={(value) => {
                  setMode(value as "courses" | "instructors");
                  courseFilters.onReset();
                  instructorFilters.onReset();
                }}
                selectedOption={mode}
              />
            </div>
            <div className="courses-section__explore-header__right">
              {mode === "courses" && (
                <select
                  className="sort-dropdown"
                  value={courseFilters.sort.value || ""}
                  onChange={(e) =>
                    courseFilters.sort.setValue(
                      (e.target.value as SortState) || null
                    )
                  }
                >
                  <option value="">Sort By</option>
                  <option value="reviews-asc">Reviews ↑</option>
                  <option value="reviews-desc">Reviews ↓</option>
                  <option value="rating-asc">Rating ↑</option>
                  <option value="rating-desc">Rating ↓</option>
                  <option value="difficulty-asc">Difficulty ↑</option>
                  <option value="difficulty-desc">Difficulty ↓</option>
                </select>
              )}
            </div>
          </div>
          <SearchBar
            handleInputChange={setQuery}
            searchSelected={searchSelected}
            setSearchSelected={setSearchSelected}
            placeholder={
              mode === "courses"
                ? "course code, title, description, or instructor"
                : "instructor name or course code"
            }
          />
          {mode === "courses" ? (
            <InfiniteScroll
              dataLength={visibleCourses.length}
              hasMore={visibleCourses.length < maxVisibleCoursesLength}
              loader={<p>Loading...</p>}
              next={loadMoreCourses}
              className="courses-container"
            >
              {visibleCourses.map((outline) => (
                <ExploreCourseCard
                  key={outline.dept + outline.number}
                  course={outline}
                  query={query}
                  showPrereqs={courseFilters.prereqs.isShown}
                  prereqsQuery={courseFilters.prereqs.searchQuery}
                  showInstructors={true}
                  reviewData={getCourseReviewData(
                    `${outline.dept}${outline.number}`
                  )}
                />
              ))}
            </InfiniteScroll>
          ) : (
            <InfiniteScroll
              dataLength={visibleInstructors.length}
              hasMore={visibleInstructors.length < maxVisibleInstructors}
              loader={<p>Loading...</p>}
              next={loadMoreInstructors}
              className="courses-container"
            >
              {visibleInstructors.map((instructor) => (
                <InstructorCard
                  key={instructor.name}
                  instructor={instructor}
                  query={query}
                  isLink
                  reviewData={getInstructorReviewData(instructor.name)}
                />
              ))}
            </InfiniteScroll>
          )}
        </section>
        <section className="filter-section">
          {mode === "courses" ? (
            <ExploreFilter
              subjects={courseFilters.subjects}
              levels={courseFilters.levels}
              terms={courseFilters.terms}
              prereqs={courseFilters.prereqs}
              designations={courseFilters.designations}
              deliveries={courseFilters.deliveries}
              reviews={courseFilters.reviews}
              courseSubjectSelectInputRef={
                courseFilters.courseSubjectSelectInputRef
              }
              onReset={courseFilters.onReset}
            />
          ) : (
            <InstructorExploreFilter
              subjects={instructorFilters.subjects}
              terms={instructorFilters.terms}
              instructorSubjectSelectInputRef={
                instructorFilters.instructorSubjectSelectInputRef
              }
              onReset={instructorFilters.onReset}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default ExplorePage;
