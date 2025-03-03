import React, { useState, useEffect, useRef } from "react";
import { SearchBar } from "./SearchBar";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { getCourseAPIData } from "@utils";
import { Link, Search } from "react-feather";
import { Button } from "./Button";

interface GlobalSearchProps {
  placeholder?: string;
}

// Minimal course data needed for search
interface MinimalCourseData {
  dept: string;
  number: string;
  title: string;
}

// Improved platform detection
const isMacPlatform = (): boolean => {
  if (typeof window === "undefined") return false;

  return (
    typeof navigator !== "undefined" &&
    (navigator.platform.startsWith("Mac") ||
      navigator.userAgent.includes("Macintosh"))
  );
};

export const GlobalSearch: React.FC<GlobalSearchProps> = () => {
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filteredResults, setFilteredResults] = useState<MinimalCourseData[]>(
    []
  );
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false); // Track scrolling state
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);
  const router = useRouter();

  // Detect platform after component mounts
  useEffect(() => {
    setIsMac(isMacPlatform());
  }, []);

  // Handle clicking outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

  // Focus the input when the modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      // Reset state when modal closes
      setQuery("");
      setSelectedIndex(-1);
    }
  }, [showModal]);

  // Scroll selected item into view when navigating with keyboard
  useEffect(() => {
    if (
      selectedIndex >= 0 &&
      resultsContainerRef.current &&
      filteredResults.length > 0
    ) {
      // Don't scroll if currently scrolling from mouse
      if (isScrolling) return;

      // Use a timeout to ensure we don't interrupt any ongoing scrolling
      const scrollTimeout = setTimeout(() => {
        if (!resultsContainerRef.current) return;

        const selectedElement = resultsContainerRef.current.querySelector(
          `li:nth-child(${selectedIndex + 1})`
        ) as HTMLElement;

        if (selectedElement) {
          // Use a more controlled scrolling approach
          const container = resultsContainerRef.current;
          const containerRect = container.getBoundingClientRect();
          const elementRect = selectedElement.getBoundingClientRect();

          // Only scroll if the element is out of view
          if (elementRect.bottom > containerRect.bottom) {
            // Element is below view, scroll down just enough
            const scrollAmount = elementRect.bottom - containerRect.bottom + 10; // Add small padding
            container.scrollTop += scrollAmount;
          } else if (elementRect.top < containerRect.top) {
            // Element is above view, scroll up just enough
            const scrollAmount = containerRect.top - elementRect.top + 10; // Add small padding
            container.scrollTop -= scrollAmount;
          }
        }
      }, 50); // Small delay to avoid race conditions

      return () => clearTimeout(scrollTimeout);
    }
  }, [selectedIndex, filteredResults, isScrolling]);

  // Add a scroll event listener to prevent keyboard nav conflicts
  useEffect(() => {
    const resultsContainer = resultsContainerRef.current;
    if (!resultsContainer) return;

    const handleScroll = () => {
      setIsScrolling(true);
      // Reset the scrolling flag after scrolling stops
      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    resultsContainer.addEventListener("scroll", handleScroll);

    return () => {
      resultsContainer.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [showModal]); // Re-run when modal visibility changes

  // Store the timeout ID for scroll tracking
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // IMPORTANT: Use a separate query key for global search to ensure independent data loading
  const { data: searchData, isLoading } = useQuery({
    queryKey: ["globalSearchIndex"], // Different from the explore page query key
    queryFn: async () => {
      try {
        // Fetch course data directly
        const response = await getCourseAPIData("/outlines/all");
        // Extract only what we need for search to keep it lightweight
        return response.data.map((course: any) => ({
          dept: course.dept,
          number: course.number,
          title: course.title,
        }));
      } catch (error) {
        console.error("Error fetching search data:", error);
        return [];
      }
    },
    // Ensure data is fetched when component mounts
    refetchOnMount: true,
    // Keep data fresh but allow for some caching
    staleTime: 15 * 60 * 1000, // 15 minutes
    // Retry failed requests
    retry: 2,
    // Don't refetch unnecessarily
    refetchOnWindowFocus: false,
  });

  // Listen for keyboard shortcuts globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault(); // Prevent browser's default behavior
        setShowModal(true);
      }

      // Handle Escape key to close modal
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);

  // Filter results when query changes
  useEffect(() => {
    if (query.length < 2 || !searchData) {
      setFilteredResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    let results = searchData.filter(
      (course: { dept: string; number: string; title: string }) => {
        const searchString =
          `${course.dept} ${course.number} ${course.title}`.toLowerCase();
        return searchString.includes(lowerQuery);
      }
    );

    // Limit to 15 results for better performance and UX
    setFilteredResults(results.slice(0, 15));
    // Reset selected index when results change
    setSelectedIndex(-1);
  }, [query, searchData]);

  // Handle keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();

      // Prevent conflicting with mouse scrolling
      if (isScrolling) {
        setIsScrolling(false);
        return;
      }

      setSelectedIndex((prevIndex) => {
        if (prevIndex === -1) {
          // If no item is selected, select the first one
          return 0;
        } else if (prevIndex < filteredResults.length - 1) {
          // If not at the last item, move down
          return prevIndex + 1;
        }
        // At the last item, stay there
        return prevIndex;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();

      // Prevent conflicting with mouse scrolling
      if (isScrolling) {
        setIsScrolling(false);
        return;
      }

      setSelectedIndex((prevIndex) => {
        if (prevIndex > 0) {
          // If not at the first item, move up
          return prevIndex - 1;
        } else if (prevIndex === 0) {
          // If at the first item, move focus back to search
          searchInputRef.current?.focus();
          return -1;
        }
        // No item selected, stay that way
        return prevIndex;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();

      if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
        // Navigate to the selected result
        const course = filteredResults[selectedIndex];
        router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
        setShowModal(false);
      } else if (filteredResults.length > 0) {
        // Navigate to the first result if none is selected
        const course = filteredResults[0];
        router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
        setShowModal(false);
      }
    }
  };

  // Handle course selection
  const handleSelectCourse = (course: MinimalCourseData) => {
    router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
    setShowModal(false);
  };

  // Handle mouse enter for each result item
  const handleMouseEnter = (index: number) => {
    // Only update if not currently using keyboard navigation
    setSelectedIndex(index);
  };

  return (
    <>
      {/* Search Button in Header */}
      <div className="global-search-button" onClick={() => setShowModal(true)}>
        <Search size={20} />
        <span className="search-label">Search</span>
        <div className="search-shortcut">
          <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
          <span>+</span>
          <kbd>K</kbd>
        </div>
      </div>

      {/* Search Modal */}
      {showModal && (
        <div className="global-search-modal">
          <div className="global-search-modal-content" ref={modalRef}>
            <div className="global-search-header">
              <h3>Search Courses</h3>
              <Button
                label="Close"
                onClick={() => setShowModal(false)}
                type="secondary"
                className="close-btn"
              />
            </div>

            <div className="global-search-input">
              <SearchBar
                handleInputChange={setQuery}
                searchSelected={true}
                setSearchSelected={() => {}}
                placeholder="Search by course code, title, or description"
                value={query}
                onKeyDown={handleKeyDown}
                className="modal-search"
                ref={searchInputRef}
              />
            </div>

            <div className="global-search-results" ref={resultsContainerRef}>
              {isLoading ? (
                <div className="search-loading">Loading courses...</div>
              ) : query.length < 2 ? (
                <div className="search-hint">
                  <p>
                    Try searching for a course code (e.g., CMPT 225) or topic
                  </p>
                  <div className="search-instructions">
                    <div className="instruction">
                      <kbd>↑</kbd>
                      <kbd>↓</kbd>
                      <span>to navigate</span>
                    </div>
                    <div className="instruction">
                      <kbd>Enter</kbd>
                      <span>to select</span>
                    </div>
                    <div className="instruction">
                      <kbd>Esc</kbd>
                      <span>to close</span>
                    </div>
                  </div>
                </div>
              ) : filteredResults.length > 0 ? (
                <ul className="search-results-list">
                  {filteredResults.map((course, index) => (
                    <li
                      key={`${course.dept}${course.number}`}
                      className={index === selectedIndex ? "selected" : ""}
                      ref={index === selectedIndex ? selectedItemRef : null}
                      data-index={index} // Add index as data attribute for debugging
                    >
                      <button
                        className="search-result-item"
                        onClick={() => handleSelectCourse(course)}
                        onMouseEnter={() => handleMouseEnter(index)}
                      >
                        <p>
                          <span className="course-code">
                            {course.dept} {course.number}
                          </span>
                          <span className="course-title">
                            {" "}
                            - {course.title}
                          </span>
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-results">
                  No courses found for &quot;{query}&quot;
                </div>
              )}
            </div>

            <div className="global-search-footer">
              <Link href="/explore" className="browse-all-link">
                Browse all courses
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
