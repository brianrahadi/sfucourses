import { ExploreFilter, Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { loadData, numberWithCommas } from "utils";
import { CourseOutline } from "types/api-types";
import { CourseCard } from "components/CourseCard";
import InfiniteScroll from "react-infinite-scroll-component";
import { SearchBar } from "components/SearchBar";

interface ExplorePageProps {
  initialOutlines?: CourseOutline[];
}

const ExplorePage: React.FC<ExplorePageProps> = ({ initialOutlines }) => {
  const [courses, setCourses] = useState<CourseOutline[] | undefined>(
    initialOutlines || undefined
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

  // const filters = {
  //     query: query ? query : null,
  // }

  const loadMore = () => {
    if (!courses) {
      return;
    }

    const filteredCourses = filterCoursesByQuery();
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

    const filteredCourses = filterCoursesByQuery();
    const slicedCourses = filteredCourses.slice(0, sliceIndex);

    setMaxVisibleCoursesLength(filteredCourses.length);
    setVisibleCourses(slicedCourses);
    setSliceIndex(CHUNK_SIZE);
  };

  // precondition: defined courses
  const filterCoursesByQuery = () => {
    if (!query) {
      return courses!;
    }
    return courses!.filter((outline) => {
      const headerText = `${outline.dept} ${outline.number} - ${outline.title} (${outline.units})`;
      const stringArr = [headerText, outline.description];
      const isQuerySubstring = stringArr.some((str) =>
        str.toLowerCase().includes(query.toLowerCase())
      );
      return isQuerySubstring;
    });
  };

  useEffect(onFilterChange, [query]);

  useEffect(() => {
    if (!courses) {
      loadData("/outlines/all", (res) => setCourses(res.data)).then();
    }
    if (courses) {
      setVisibleCourses(courses.slice(0, CHUNK_SIZE));
      setMaxVisibleCoursesLength(courses.length);
    }
  }, [courses]);

  return (
    <div className="page courses-page">
      <Hero
        title={`exploring ${
          maxVisibleCoursesLength
            ? numberWithCommas(maxVisibleCoursesLength) + " "
            : ""
        } course(s)`}
        backgroundImage={HeroImage.src}
      />
      <main id="explore-container" className="container">
        <section className="courses-section">
          <SearchBar
            handleInputChange={setQuery}
            searchSelected={searchSelected}
            setSearchSelected={setSearchSelected}
            placeholder="course code, title, or description"
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
                />
              ))}
            </InfiniteScroll>
          )}
        </section>
        <section className="filter-section">
          <ExploreFilter />
        </section>
      </main>
    </div>
  );
};

export default ExplorePage;
