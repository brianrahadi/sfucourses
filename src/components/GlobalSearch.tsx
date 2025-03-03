import React, { useState, useEffect, useRef } from "react";
import { SearchBar } from "./SearchBar";
import { useOnClickOutside } from "@hooks";
import { useRouter } from "next/router";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCourseAPIData } from "@utils";

interface GlobalSearchProps {
  placeholder?: string;
}

// Minimal course data needed for search
interface MinimalCourseData {
  dept: string;
  number: string;
  title: string;
}

// Access the global window object safely
const getInitialSearchData = (): MinimalCourseData[] => {
  if (typeof window !== "undefined" && window.__COURSE_SEARCH_DATA__) {
    return window.__COURSE_SEARCH_DATA__;
  }
  return [];
};

// Add type definition for window object
declare global {
  interface Window {
    __COURSE_SEARCH_DATA__?: MinimalCourseData[];
  }
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = "Search courses (e.g., CMPT 225)",
}) => {
  const [query, setQuery] = useState("");
  const [searchSelected, setSearchSelected] = useState(false);
  const [filteredResults, setFilteredResults] = useState<MinimalCourseData[]>(
    []
  );
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Use React Query with the server-side injected data as initialData
  const { data: searchData, isLoading } = useQuery({
    queryKey: ["courseSearchIndex"],
    queryFn: async () => {
      // This will only run if the initial data is not available
      const response = await getCourseAPIData("/outlines/all");
      return response.data.map((course: any) => ({
        dept: course.dept,
        number: course.number,
        title: course.title,
      }));
    },
    initialData: getInitialSearchData(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Close results when clicking outside
  useOnClickOutside(searchContainerRef, () => setShowResults(false));

  // Filter results when query changes
  useEffect(() => {
    if (query.length < 2 || !searchData) {
      setFilteredResults([]);
      setShowResults(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = searchData
      .filter((course: { dept: any; number: any; title: any }) => {
        const searchString =
          `${course.dept} ${course.number} ${course.title}`.toLowerCase();
        return searchString.includes(lowerQuery);
      })
      .slice(0, 10); // Limit to 10 results

    setFilteredResults(results);
    setShowResults(true);
  }, [query, searchData]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredResults.length > 0) {
      const course = filteredResults[0];
      router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
      setShowResults(false);
    }
  };

  return (
    <div className="global-search-container" ref={searchContainerRef}>
      <SearchBar
        handleInputChange={setQuery}
        searchSelected={searchSelected}
        setSearchSelected={setSearchSelected}
        placeholder={placeholder}
        value={query}
        onKeyDown={handleKeyDown}
        className="header-search"
      />

      {showResults && (
        <div className="search-results">
          {isLoading ? (
            <div className="search-loading">Loading...</div>
          ) : filteredResults.length > 0 ? (
            <ul>
              {filteredResults.map((course) => (
                <li key={`${course.dept}${course.number}`}>
                  <Link
                    href={`/explore/${course.dept.toLowerCase()}-${
                      course.number
                    }`}
                    onClick={() => setShowResults(false)}
                  >
                    <span className="course-code">
                      {course.dept} {course.number}
                    </span>
                    <span className="course-title">{course.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="no-results">No courses found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
