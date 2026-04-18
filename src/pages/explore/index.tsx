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
import { useEffect, useMemo } from "react";
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
import { SortState } from "src/hooks/UseExploreFilters";
import { InstructorSortState } from "src/hooks/useInstructorExploreFilters";
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
import { BASE_URL } from "@const";
import { useExploreStore } from "src/store/useExploreStore";

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
    queryFn: () => getCourseAPIData("/reviews/instructors"),
  });

  await queryClient.prefetchQuery({
    queryKey: ["courseReviews"],
    queryFn: () => getCourseAPIData("/reviews/courses"),
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    revalidate: 60 * 60 * 24, // daily
  };
};

const CHUNK_SIZE = 20;

const ExplorePage: React.FC = () => {
  // Queries
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

  const { data: instructorReviewsData, isLoading: isLoadingReviews } = useQuery<
    InstructorReviewSummary[]
  >({
    queryKey: ["instructorReviews"],
    queryFn: () => getCourseAPIData("/reviews/instructors"),
    staleTime: 60 * 60 * 1000,
  });

  const { data: courseReviewsData, isLoading: isLoadingCourseReviews } =
    useQuery<CourseReviewSummary[]>({
      queryKey: ["courseReviews"],
      queryFn: () => getCourseAPIData("/reviews/courses"),
      staleTime: 60 * 60 * 1000,
    });

  const courses = courseData || [];
  const instructors = instructorData || [];

  // Store Connections
  const mode = useExploreStore((state) => state.mode);
  const setMode = useExploreStore((state) => state.setMode);
  const query = useExploreStore((state) => state.query);
  const setQuery = useExploreStore((state) => state.setQuery);
  const searchSelected = useExploreStore((state) => state.searchSelected);
  const setSearchSelected = useExploreStore((state) => state.setSearchSelected);

  const courseSliceIndex = useExploreStore((state) => state.courseSliceIndex);
  const setCourseSliceIndex = useExploreStore(
    (state) => state.setCourseSliceIndex
  );
  const instructorSliceIndex = useExploreStore(
    (state) => state.instructorSliceIndex
  );
  const setInstructorSliceIndex = useExploreStore(
    (state) => state.setInstructorSliceIndex
  );

  // Course Filter Store Bindings
  const courseSubjects = useExploreStore((state) => state.courseSubjects);
  const courseLevels = useExploreStore((state) => state.courseLevels);
  const courseTerms = useExploreStore((state) => state.courseTerms);
  const courseDeliveries = useExploreStore((state) => state.courseDeliveries);
  const coursePrereqSearchQuery = useExploreStore(
    (state) => state.coursePrereqSearchQuery
  );
  const coursePrereqIsShown = useExploreStore(
    (state) => state.coursePrereqIsShown
  );
  const coursePrereqHasNone = useExploreStore(
    (state) => state.coursePrereqHasNone
  );
  const courseDesignations = useExploreStore(
    (state) => state.courseDesignations
  );
  const courseMinReviews = useExploreStore((state) => state.courseMinReviews);
  const courseSortValue = useExploreStore((state) => state.courseSortValue);
  const setCourseSortValue = useExploreStore(
    (state) => state.setCourseSortValue
  );
  const resetCourseFilters = useExploreStore(
    (state) => state.resetCourseFilters
  );

  // Instructor Filter Store Bindings
  const instructorSubjects = useExploreStore(
    (state) => state.instructorSubjects
  );
  const instructorTerms = useExploreStore((state) => state.instructorTerms);
  const instructorMinReviews = useExploreStore(
    (state) => state.instructorMinReviews
  );
  const instructorSortValue = useExploreStore(
    (state) => state.instructorSortValue
  );
  const setInstructorSortValue = useExploreStore(
    (state) => state.setInstructorSortValue
  );
  const resetInstructorFilters = useExploreStore(
    (state) => state.resetInstructorFilters
  );

  // Helper Methods
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

  const getCourseReviewData = (
    courseCode: string
  ): CourseReviewSummary | undefined => {
    if (!courseReviewsData) return undefined;
    return (
      courseReviewsData.find(
        (review) =>
          review.course_code.toLowerCase() === courseCode.toLowerCase()
      ) || undefined
    );
  };

  const courseReviewMap = useMemo(() => {
    if (!courseReviewsData) return new Map<string, CourseReviewSummary>();
    const map = new Map<string, CourseReviewSummary>();
    courseReviewsData.forEach((review) => {
      map.set(review.course_code.toLowerCase(), review);
    });
    return map;
  }, [courseReviewsData]);

  const instructorReviewMap = useMemo(() => {
    if (!instructorReviewsData)
      return new Map<string, InstructorReviewSummary>();
    const map = new Map<string, InstructorReviewSummary>();
    instructorReviewsData.forEach((review) => {
      map.set(review.Name.toLowerCase(), review);
    });
    return map;
  }, [instructorReviewsData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          const searchInput = document.querySelector(
            'input[placeholder*="course"]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
          break;
        case "c":
          e.preventDefault();
          if (mode !== "courses") {
            setMode("courses");
            resetCourseFilters();
            resetInstructorFilters();
          }
          break;
        case "i":
          e.preventDefault();
          if (mode !== "instructors") {
            setMode("instructors");
            resetCourseFilters();
            resetInstructorFilters();
          }
          break;
        case "r":
          e.preventDefault();
          resetCourseFilters();
          resetInstructorFilters();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mode, resetCourseFilters, resetInstructorFilters, setMode]);

  // Derived State (filtering) using useMemo directly returning filtered+sorted list
  const filteredAndSortedCourses = useMemo(() => {
    if (courses.length === 0) return [];

    let filtered = courses;
    filtered = filterCourseBySubjects(filtered, courseSubjects);
    filtered = filterCoursesByLevels(filtered, courseLevels);
    filtered = filterCoursesByOfferedTerms(filtered, courseTerms);
    filtered = filterCoursesByDeliveries(filtered, courseDeliveries);
    filtered = filterCoursesByDesignations(filtered, courseDesignations);
    filtered = filterCoursesByPrereqs(
      filtered,
      coursePrereqSearchQuery,
      coursePrereqHasNone
    );
    filtered = filterCoursesByReviews(
      filtered,
      courseMinReviews,
      courseReviewMap
    );
    filtered = filterCoursesByQuery(filtered, query);

    if (!courseSortValue) return filtered;

    const [field, direction] = courseSortValue.split("-");
    const isAsc = direction === "asc";
    const sortedCourses = [...filtered];

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
  }, [
    courses,
    courseSubjects,
    courseLevels,
    courseTerms,
    courseDeliveries,
    courseDesignations,
    coursePrereqSearchQuery,
    coursePrereqHasNone,
    courseMinReviews,
    courseReviewMap,
    query,
    courseSortValue,
  ]);

  const filteredAndSortedInstructors = useMemo(() => {
    if (instructors.length === 0) return [];

    let filtered = instructors;

    if (instructorSubjects.length > 0) {
      filtered = filtered.filter((instructor) =>
        instructor.offerings.some((offering) =>
          instructorSubjects.includes(offering.dept)
        )
      );
    }
    if (instructorTerms.length > 0) {
      filtered = filtered.filter((instructor) =>
        instructor.offerings.some((offering) =>
          instructorTerms.some((term) =>
            offering.term.toLowerCase().includes(term.toLowerCase())
          )
        )
      );
    }
    if (instructorMinReviews > 0) {
      filtered = filtered.filter((instructor) => {
        const reviewData = instructorReviewMap.get(
          instructor.name.toLowerCase()
        );
        const totalReviews = reviewData ? parseInt(reviewData.Ratings) || 0 : 0;
        return totalReviews >= instructorMinReviews;
      });
    }
    if (query) {
      filtered = filtered.filter(
        (instructor) =>
          instructor.name.toLowerCase().includes(query.toLowerCase()) ||
          instructor.offerings.some((offering) =>
            `${offering.dept} ${offering.number}`
              .toLowerCase()
              .includes(query.toLowerCase())
          )
      );
    }

    if (!instructorSortValue) return filtered;

    const lastDashIndex = instructorSortValue.lastIndexOf("-");
    const field = instructorSortValue.substring(0, lastDashIndex);
    const direction = instructorSortValue.substring(lastDashIndex + 1);
    const isAsc = direction === "asc";
    const sortedInstructors = [...filtered];

    sortedInstructors.sort((a, b) => {
      const reviewA = instructorReviewMap.get(a.name.toLowerCase());
      const reviewB = instructorReviewMap.get(b.name.toLowerCase());

      let valueA = 0;
      let valueB = 0;

      if (field === "quality") {
        valueA = reviewA ? parseFloat(reviewA.Quality) || 0 : 0;
        valueB = reviewB ? parseFloat(reviewB.Quality) || 0 : 0;
      } else if (field === "difficulty") {
        valueA = reviewA ? parseFloat(reviewA.Difficulty) || 0 : 0;
        valueB = reviewB ? parseFloat(reviewB.Difficulty) || 0 : 0;
      } else if (field === "would-take-again") {
        const wouldTakeAgainA = reviewA?.WouldTakeAgain || "0";
        const wouldTakeAgainB = reviewB?.WouldTakeAgain || "0";
        const cleanedA = wouldTakeAgainA.replace(/%/g, "").trim();
        const cleanedB = wouldTakeAgainB.replace(/%/g, "").trim();
        valueA = cleanedA && cleanedA !== "N/A" ? parseFloat(cleanedA) || 0 : 0;
        valueB = cleanedB && cleanedB !== "N/A" ? parseFloat(cleanedB) || 0 : 0;
      } else if (field === "reviews") {
        valueA = reviewA ? parseInt(reviewA.Ratings) || 0 : 0;
        valueB = reviewB ? parseInt(reviewB.Ratings) || 0 : 0;
      }

      return isAsc ? valueA - valueB : valueB - valueA;
    });

    return sortedInstructors;
  }, [
    instructors,
    instructorSubjects,
    instructorTerms,
    instructorMinReviews,
    instructorReviewMap,
    query,
    instructorSortValue,
  ]);

  const visibleCourses = useMemo(() => {
    return filteredAndSortedCourses.slice(0, courseSliceIndex);
  }, [filteredAndSortedCourses, courseSliceIndex]);

  const visibleInstructors = useMemo(() => {
    return filteredAndSortedInstructors.slice(0, instructorSliceIndex);
  }, [filteredAndSortedInstructors, instructorSliceIndex]);

  const maxVisibleCoursesLength = filteredAndSortedCourses.length;
  const maxVisibleInstructors = filteredAndSortedInstructors.length;

  const loadMoreCourses = () => {
    setCourseSliceIndex((prev) => prev + CHUNK_SIZE);
  };
  const loadMoreInstructors = () => {
    setInstructorSliceIndex((prev) => prev + CHUNK_SIZE);
  };

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
                  resetCourseFilters();
                  resetInstructorFilters();
                }}
                selectedOption={mode}
              />
            </div>
            <div className="courses-section__explore-header__right">
              {mode === "courses" && (
                <select
                  className="sort-dropdown"
                  value={courseSortValue || ""}
                  onChange={(e) =>
                    setCourseSortValue((e.target.value as SortState) || null)
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
              {mode === "instructors" && (
                <select
                  className="sort-dropdown"
                  value={instructorSortValue || ""}
                  onChange={(e) =>
                    setInstructorSortValue(
                      (e.target.value as InstructorSortState) || null
                    )
                  }
                >
                  <option value="">Sort By</option>
                  <option value="quality-asc">Quality ↑</option>
                  <option value="quality-desc">Quality ↓</option>
                  <option value="difficulty-asc">Difficulty ↑</option>
                  <option value="difficulty-desc">Difficulty ↓</option>
                  <option value="would-take-again-asc">
                    Would Take Again ↑
                  </option>
                  <option value="would-take-again-desc">
                    Would Take Again ↓
                  </option>
                  <option value="reviews-asc">Reviews ↑</option>
                  <option value="reviews-desc">Reviews ↓</option>
                </select>
              )}
            </div>
          </div>
          <SearchBar
            handleInputChange={setQuery}
            searchSelected={searchSelected}
            setSearchSelected={setSearchSelected}
            value={query}
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
                  showPrereqs={coursePrereqIsShown}
                  prereqsQuery={coursePrereqSearchQuery}
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
          {mode === "courses" ? <ExploreFilter /> : <InstructorExploreFilter />}
        </section>
      </main>
    </div>
  );
};

export default ExplorePage;
