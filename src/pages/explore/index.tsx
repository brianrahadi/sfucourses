// pages/explore/index.tsx
import {
  ExploreFilter,
  Hero,
  TextBadge,
  CourseCard,
  SearchBar,
  InstructorCard,
  InstructorExploreFilter,
  ButtonGroup,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useState, useEffect } from "react";
import { CourseOutline, Instructor } from "@types";
import InfiniteScroll from "react-infinite-scroll-component";
import { useExploreFilters } from "src/hooks/UseExploreFilters";
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
} from "@utils/courseFilters";
import { numberWithCommas } from "@utils/format";
import { RotatingLines } from "react-loader-spinner";

export const getStaticProps: GetStaticProps = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["allCourses"],
    queryFn: async () => {
      const res = await getCourseAPIData("/outlines/all");
      return {
        courses: res.data,
        totalCount: res.total_count,
      };
    },
  });

  await queryClient.prefetchQuery({
    queryKey: ["allInstructors"],
    queryFn: async () => {
      const res = await getCourseAPIData("/instructors/all", false);
      return res as Instructor[];
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
      const res = await getCourseAPIData("/outlines/all");
      return {
        courses: res.data,
        totalCount: res.total_count,
      };
    },
    staleTime: 60 * 60 * 1000,
  });
  const { data: instructorData, isLoading: isLoadingInstructors } = useQuery({
    queryKey: ["allInstructors"],
    queryFn: async () => {
      const res = await getCourseAPIData("/instructors/all", false);
      return res as Instructor[];
    },
    staleTime: 60 * 60 * 1000,
  });

  const courses = courseData?.courses || [];
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
      (courses: CourseOutline[]) => filterCoursesByQuery(courses, query),
    ].reduce((filtered, filterFunc) => filterFunc(filtered), courses);
    return filteredCourses;
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
    const next = filtered.slice(
      courseSliceIndex,
      courseSliceIndex + CHUNK_SIZE
    );
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
    setMaxVisibleCoursesLength(filtered.length);
    setVisibleCourses(filtered.slice(0, CHUNK_SIZE));
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
    courses,
    mode,
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
            <TextBadge
              className="big explore"
              content={`exploring 
                ${
                  mode === "courses"
                    ? maxVisibleCoursesLength
                      ? numberWithCommas(maxVisibleCoursesLength)
                      : "0"
                    : maxVisibleInstructors
                    ? numberWithCommas(maxVisibleInstructors)
                    : "0"
                }
                ${
                  mode === "courses"
                    ? maxVisibleCoursesLength > 1
                      ? "courses"
                      : "course"
                    : maxVisibleInstructors > 1
                    ? "instructors"
                    : "instructor"
                }`}
            />
            <ButtonGroup
              options={["courses", "instructors"]}
              onSelect={(value) => {
                setMode(value as "courses" | "instructors");
              }}
              selectedOption={mode}
            />
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
                <CourseCard
                  key={outline.dept + outline.number}
                  course={outline}
                  query={query}
                  showPrereqs={courseFilters.prereqs.isShown}
                  prereqsQuery={courseFilters.prereqs.searchQuery}
                  showInstructors={true}
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
            />
          ) : (
            <InstructorExploreFilter
              subjects={instructorFilters.subjects}
              terms={instructorFilters.terms}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default ExplorePage;
