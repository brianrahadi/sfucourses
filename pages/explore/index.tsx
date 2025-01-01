import { ExploreFilter, Hero, TextBadge } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { getData, loadData, numberWithCommas } from "utils";
import { CourseOutline } from "types/api-types";
import { CourseCard } from "components/CourseCard";
import InfiniteScroll from "react-infinite-scroll-component";
import { SearchBar } from "components/SearchBar";
import { useExploreFilters } from "hooks/UseExploreFilters";
import { GetStaticProps } from "next";

interface ExplorePageProps {
  initialCourses?: CourseOutline[];
  totalCoursesCount?: number;
}

export const getStaticProps: GetStaticProps<ExplorePageProps> = async () => {
  try {
    const res = await getData("/outlines/all?limit=100");
    const courses: CourseOutline[] = res.data;
    const totalCoursesCount = res.total_count;

    return {
      props: {
        initialCourses: courses,
        totalCoursesCount: totalCoursesCount,
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

const ExplorePage: React.FC<ExplorePageProps> = ({
  initialCourses,
  totalCoursesCount,
}) => {
  const [courses, setCourses] = useState<CourseOutline[] | undefined>(
    initialCourses || undefined
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

  const { subjects, levels, terms, prereqs, designations } =
    useExploreFilters();

  const loadMore = () => {
    if (!courses) {
      return;
    }

    const filteredCourses = filterCourses(courses);
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

    const filteredCourses = filterCourses(courses);
    const slicedCourses = filteredCourses.slice(0, sliceIndex);

    setMaxVisibleCoursesLength(filteredCourses.length);
    setVisibleCourses(slicedCourses);
    setSliceIndex(CHUNK_SIZE);
  };

  const filterCourses = (courses: CourseOutline[]) => {
    const filteredCourses = [
      filterCourseBySubjects,
      filterCoursesByLevels,
      filterCoursesByTerms,
      filterCoursesByDesignations,
      filterCoursesByPrereqs,
      filterCoursesByQuery,
    ].reduce((filtered, filterFunc) => filterFunc(filtered), courses);
    return filteredCourses;
  };

  const filterCoursesByQuery = (courses: CourseOutline[]) => {
    if (!query) {
      return courses;
    }
    return courses.filter((outline) => {
      const headerText = `${outline.dept} ${outline.number} - ${outline.title} (${outline.units})`;
      const stringArr = [headerText, outline.description];
      const isQuerySubstring = stringArr.some((str) =>
        str.toLowerCase().includes(query.toLowerCase())
      );
      return isQuerySubstring;
    });
  };

  const filterCourseBySubjects = (courses: CourseOutline[]) => {
    if (subjects.selected.length == 0) {
      return courses;
    }

    const selectedSubjectsSet = new Set(subjects.selected);

    return courses.filter((course) => selectedSubjectsSet.has(course.dept));
  };

  const filterCoursesByLevels = (courses: CourseOutline[]) => {
    if (levels.selected.length == 0) {
      return courses;
    }

    const levelsFirstChar = levels.selected.map((level) => +level[0]);
    return courses.filter((course) => {
      const courseLevelFirstChar = +course.number[0];
      return levelsFirstChar.some((level) => {
        if (+level >= 5) {
          return courseLevelFirstChar >= 5;
        }
        return courseLevelFirstChar == level;
      });
    });
  };

  const filterCoursesByTerms = (courses: CourseOutline[]) => {
    if (terms.selected.length === 0) {
      return courses;
    }

    const selectedTermsSet = new Set(terms.selected);

    return courses.filter((course) => {
      return course.offerings.some((offering) =>
        selectedTermsSet.has(offering.term)
      );
    });
  };

  const filterCoursesByPrereqs = (courses: CourseOutline[]) => {
    if (!prereqs.searchQuery && !prereqs.hasNone) {
      return courses;
    }
    if (prereqs.hasNone) {
      return courses.filter(
        (course) => course.prerequisites === "" && +course.number[0] <= 4
      );
    }
    return courses.filter((course) =>
      course.prerequisites
        .toLowerCase()
        .includes(prereqs.searchQuery.toLowerCase())
    );
  };

  const filterCoursesByDesignations = (courses: CourseOutline[]) => {
    if (designations.selected.length === 0) {
      return courses;
    }

    // smallest possible substrings
    const designationSubstringMap: { [name: string]: string } = {
      W: "w",
      Q: "q",
      "B-Sci": "sci",
      "B-Soc": "soc",
      "B-Hum": "hum",
    };

    const designationsSubstrs = designations.selected.map(
      (d) => designationSubstringMap[d]
    );

    return courses.filter((course) => {
      return designationsSubstrs.some((substr) => {
        if (substr == "sci") {
          // because Sci is also substring of Social Sciences
          const sciCount = (
            course.designation.toLowerCase().match(/sci/g) || []
          ).length;
          const socCount = (
            course.designation.toLowerCase().match(/soc/g) || []
          ).length;
          return sciCount > socCount;
        }
        return course.designation.toLowerCase().includes(substr);
      });
    });
  };

  useEffect(onFilterChange, [
    query,
    subjects.selected,
    levels.selected,
    terms.selected,
    prereqs.searchQuery,
    prereqs.hasNone,
    designations.selected,
  ]);

  useEffect(() => {
    if (!courses || !totalCoursesCount || courses.length < totalCoursesCount) {
      loadData("/outlines/all", (res) => {
        totalCoursesCount = res.total_count;
        setCourses(res.data);
      });
    }
    if (courses) {
      setVisibleCourses(courses.slice(0, CHUNK_SIZE));
      setMaxVisibleCoursesLength(courses.length);
    }
  }, [courses]);

  return (
    <div className="page courses-page">
      <Hero title={`explore courses`} backgroundImage={HeroImage.src} />
      <main id="explore-container" className="container">
        <section className="courses-section">
          <TextBadge
            className="big explore"
            content={`exploring 
            ${
              maxVisibleCoursesLength
                ? numberWithCommas(maxVisibleCoursesLength)
                : "0"
            }
            ${(maxVisibleCoursesLength || 0) > 1 ? "courses" : "course"}`}
          />
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
                  showPrereqs={prereqs.isShown}
                  prereqsQuery={prereqs.searchQuery}
                  hasNoPrereq={prereqs.hasNone}
                />
              ))}
            </InfiniteScroll>
          )}
        </section>
        <section className="filter-section">
          <ExploreFilter
            subjects={subjects}
            levels={levels}
            terms={terms}
            prereqs={prereqs}
            designations={designations}
          />
        </section>
      </main>
    </div>
  );
};

export default ExplorePage;
