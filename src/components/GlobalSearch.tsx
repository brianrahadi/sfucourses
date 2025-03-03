import React, { useState, useEffect, useRef } from "react";
import { SearchBar } from "./SearchBar";
import { useOnClickOutside } from "@hooks";
import { useRouter } from "next/router";
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

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ placeholder }) => {
  const [query, setQuery] = useState("");
  const [searchSelected, setSearchSelected] = useState(false);
  const [filteredResults, setFilteredResults] = useState<MinimalCourseData[]>(
    []
  );
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const defaultPlaceholder =
    typeof navigator !== "undefined"
      ? navigator.platform.startsWith("Mac")
        ? "⌘ + K and ↑↓ Enter to search courses"
        : "Ctrl + K and ↑↓ Enter to search courses"
      : "⌘/Ctrl + K and ↑↓ Enter to search courses";

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
  useOnClickOutside(searchContainerRef, () => {
    setShowResults(false);
    setSelectedIndex(-1);
  });

  // Scroll selected item into view when navigating with keys
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const resultsContainer = resultsRef.current;
      const selectedItem = resultsContainer.querySelector(
        `li:nth-child(${selectedIndex + 1})`
      );

      if (selectedItem) {
        // Check if the item is not fully visible in the container
        const containerRect = resultsContainer.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();

        if (itemRect.bottom > containerRect.bottom) {
          // If item is below the visible area, scroll down
          selectedItem.scrollIntoView({ block: "end", behavior: "smooth" });
        } else if (itemRect.top < containerRect.top) {
          // If item is above the visible area, scroll up
          selectedItem.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      }
    }
  }, [selectedIndex]);

  // Listen for keyboard shortcuts globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault(); // Prevent browser's default behavior
        setSearchSelected(true);
        setShowResults(true);
        // Focus the search input
        searchInputRef.current?.focus();
      }

      // Handle Escape key to close search
      if (e.key === "Escape" && showResults) {
        setShowResults(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showResults]);

  // Filter results when query changes
  useEffect(() => {
    if (query.length < 2 || !searchData) {
      setFilteredResults([]);
      if (query.length < 2) setShowResults(false);
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
    // Reset selected index when results change
    setSelectedIndex(-1);
  }, [query, searchData]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        // Move to first item if nothing selected, otherwise move down
        if (prev < filteredResults.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();

      if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
        // Navigate to the selected result
        const course = filteredResults[selectedIndex];
        router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
        setShowResults(false);
        setSelectedIndex(-1);
      } else if (filteredResults.length > 0) {
        // Navigate to the first result if none is selected
        const course = filteredResults[0];
        router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
        setShowResults(false);
        setSelectedIndex(-1);
      }
    }
  };

  // Handle course selection
  const handleSelectCourse = (course: MinimalCourseData) => {
    router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="global-search-container" ref={searchContainerRef}>
      <SearchBar
        handleInputChange={setQuery}
        searchSelected={searchSelected}
        setSearchSelected={setSearchSelected}
        placeholder={defaultPlaceholder}
        value={query}
        onKeyDown={handleKeyDown}
        className="header-search"
        ref={searchInputRef}
      />

      {showResults && (
        <div className="search-results" ref={resultsRef}>
          {isLoading ? (
            <div className="search-loading">Loading...</div>
          ) : filteredResults.length > 0 ? (
            <ul>
              {filteredResults.map((course, index) => (
                <li
                  key={`${course.dept}${course.number}`}
                  className={index === selectedIndex ? "selected" : ""}
                >
                  <button
                    className="search-result-item"
                    onClick={() => handleSelectCourse(course)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="course-code">
                      {course.dept} {course.number}
                    </span>
                    <span className="course-title">{course.title}</span>
                  </button>
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
