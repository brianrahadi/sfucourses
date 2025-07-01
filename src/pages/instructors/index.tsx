// pages/explore/index.tsx
import {
  ExploreFilter,
  Hero,
  TextBadge,
  CourseCard,
  SearchBar,
  InstructorCard,
  InstructorExploreFilter,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useState, useEffect } from "react";
import { CourseOutline, Instructor } from "@types";
import InfiniteScroll from "react-infinite-scroll-component";
import { useExploreFilters } from "src/hooks/UseExploreFilters";
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
import {
  filterInstructorsByQuery,
  filterInstructorsBySubject,
  filterInstructorsByTerm,
} from "@utils/instructorFilters";

// Use getStaticProps to fetch and cache data at build time
export const getStaticProps: GetStaticProps = async () => {
  const queryClient = new QueryClient();

  // Prefetch the full course data
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

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    revalidate: 60 * 60 * 24, // daily
  };
};

const InstructorPage: React.FC = () => {
  // Use React Query to access the prefetched data
  const { data: instructorData, isLoading } = useQuery({
    queryKey: ["allInstructors"],
    // Add queryFn as a fallback in case the data isn't hydrated
    queryFn: async () => {
      const res = await getCourseAPIData("/instructors/all", false);
      return res as Instructor[];
    },
    // Keep the data fresh for a long time
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const instructors = instructorData || [];

  const [visibleInstructors, setVisibleInstructors] = useState<Instructor[]>(
    []
  );
  const [maxVisibleInstructors, setMaxVisibleInstructors] = useState<number>(0);
  const [sliceIndex, setSliceIndex] = useState(20);
  const [query, setQuery] = useState<string>("");
  const [searchSelected, setSearchSelected] = useState<boolean>(false);
  const CHUNK_SIZE = 20;

  const { subjects, levels, terms, prereqs, designations, deliveries } =
    useExploreFilters();

  const loadMore = () => {
    if (instructors.length === 0) {
      return;
    }

    const filteredInstructors = filterInstructors(instructors);
    const nextInstructors = filteredInstructors.slice(
      sliceIndex,
      sliceIndex + CHUNK_SIZE
    );
    setVisibleInstructors((prev) => [...prev, ...nextInstructors]);
    setSliceIndex((prev) => prev + CHUNK_SIZE);
  };

  const onFilterChange = () => {
    if (instructors.length === 0) {
      return;
    }

    const filteredCourses = filterInstructors(instructors);
    const slicedCourses = filteredCourses.slice(0, CHUNK_SIZE);

    setMaxVisibleInstructors(filteredCourses.length);
    setVisibleInstructors(slicedCourses);
    setSliceIndex(CHUNK_SIZE);
  };

  const filterInstructors = (instructors: Instructor[]) => {
    const filteredInstructors = [
      (instructors: Instructor[]) =>
        filterInstructorsByQuery(instructors, query),
      (instructors: Instructor[]) =>
        filterInstructorsBySubject(instructors, subjects.selected),
      (instructors: Instructor[]) =>
        filterInstructorsByTerm(instructors, terms.selected),
    ].reduce((filtered, filterFunc) => filterFunc(filtered), instructors);
    console.log(filteredInstructors);
    return filteredInstructors;
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
  ]);

  // Initialize visible courses when data is loaded
  useEffect(() => {
    if (instructors.length > 0) {
      setVisibleInstructors(instructors.slice(0, CHUNK_SIZE));
      setMaxVisibleInstructors(instructors.length);
    }
  }, [instructors]);

  if (isLoading && instructors.length === 0) {
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
                maxVisibleInstructors
                  ? numberWithCommas(maxVisibleInstructors)
                  : "0"
              }
              ${maxVisibleInstructors > 1 ? "instructors" : "instructor"}`}
          />
          <SearchBar
            handleInputChange={setQuery}
            searchSelected={searchSelected}
            setSearchSelected={setSearchSelected}
            placeholder="instructor name or course code"
          />
          <InfiniteScroll
            dataLength={visibleInstructors.length}
            hasMore={visibleInstructors.length < maxVisibleInstructors}
            loader={<p>Loading...</p>}
            next={loadMore}
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
        </section>
        <section className="filter-section">
          <InstructorExploreFilter
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

export default InstructorPage;
