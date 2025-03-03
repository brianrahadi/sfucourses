import React, { useState, useEffect, useRef } from "react";
import { SearchBar } from "./SearchBar";
import { useOnClickOutside } from "@hooks";
import { useRouter } from "next/router";
import Link from "next/link";
import { CourseOutline } from "@types";

interface GlobalSearchProps {
  placeholder?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = "Search courses (e.g., CMPT 225)",
}) => {
  const [query, setQuery] = useState("");
  const [searchSelected, setSearchSelected] = useState(false);
  const [results, setResults] = useState<CourseOutline[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close results when clicking outside
  useOnClickOutside(searchContainerRef, () => setShowResults(false));

  useEffect(() => {
    const searchCourses = async () => {
      if (query.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      setShowResults(true);

      try {
        // Search from cache if available, otherwise fetch from API
        const cachedData = localStorage.getItem("courseSearchCache");
        let courses: CourseOutline[] = [];

        if (cachedData) {
          courses = JSON.parse(cachedData);
        } else {
          // If no cache, get a minimal dataset for search
          const response = await fetch(`/api/courses/search-index`);
          if (response.ok) {
            courses = await response.json();
            // Cache results for 24 hours
            localStorage.setItem("courseSearchCache", JSON.stringify(courses));
            localStorage.setItem("cacheTimestamp", Date.now().toString());
          }
        }

        // Filter courses based on query
        const filtered = courses
          .filter((course) => {
            const searchString =
              `${course.dept} ${course.number} ${course.title}`.toLowerCase();
            return searchString.includes(query.toLowerCase());
          })
          .slice(0, 10); // Limit to 10 results

        setResults(filtered);
      } catch (error) {
        console.error("Error searching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(() => {
      searchCourses();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results.length > 0) {
      const course = results[0];
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
          {loading ? (
            <div className="search-loading">Loading...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((course) => (
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
