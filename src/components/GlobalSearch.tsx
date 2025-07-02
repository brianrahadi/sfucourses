import React, { useState, useEffect, useRef } from "react";
import { SearchBar } from "./SearchBar";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { getCourseAPIData } from "@utils";
import { Search } from "react-feather";
import { Button } from "./Button";
import Link from "next/link";
import { InstructorCard } from "./InstructorCard";

interface GlobalSearchProps {
  placeholder?: string;
}

interface MinimalCourseData {
  dept: string;
  number: string;
  title: string;
}

interface MinimalInstructorData {
  name: string;
  offerings: { dept: string; number: string; term: string; title: string }[];
}

type SearchResult =
  | { type: "course"; data: MinimalCourseData }
  | { type: "instructor"; data: MinimalInstructorData };

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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);
  const router = useRouter();

  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: courseData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["globalSearchIndex"],
    queryFn: async () => {
      try {
        const response = await getCourseAPIData("/outlines/all");
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
    refetchOnMount: true,
    staleTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const { data: instructorData, isLoading: isLoadingInstructors } = useQuery({
    queryKey: ["globalInstructorSearchIndex"],
    queryFn: async () => {
      try {
        const response = await getCourseAPIData("/instructors/all", false);
        return response as MinimalInstructorData[];
      } catch (error) {
        console.error("Error fetching instructor data:", error);
        return [];
      }
    },
    refetchOnMount: true,
    staleTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setIsMac(isMacPlatform());
  }, []);

  useEffect(() => {
    if (showModal) {
      const currentScrollPosition = window.pageYOffset;
      setScrollPosition(currentScrollPosition);

      document.body.classList.add("modal-open");

      document.body.style.top = `-${currentScrollPosition}px`;
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.top = "";

      if (scrollPosition) {
        window.scrollTo(0, scrollPosition);
      }
    }

    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
    };
  }, [showModal, scrollPosition]);

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

  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setSelectedIndex(-1);
    }
  }, [showModal]);

  useEffect(() => {
    if (
      selectedIndex >= 0 &&
      resultsContainerRef.current &&
      results.length > 0
    ) {
      if (isScrolling) return;
      const scrollTimeout = setTimeout(() => {
        if (!resultsContainerRef.current) return;
        const selectedElement = resultsContainerRef.current.querySelector(
          `li:nth-child(${selectedIndex + 1})`
        ) as HTMLElement;
        if (selectedElement) {
          const container = resultsContainerRef.current;
          const containerRect = container.getBoundingClientRect();
          const elementRect = selectedElement.getBoundingClientRect();
          if (elementRect.bottom > containerRect.bottom) {
            const scrollAmount = elementRect.bottom - containerRect.bottom + 10;
            container.scrollTop += scrollAmount;
          } else if (elementRect.top < containerRect.top) {
            const scrollAmount = containerRect.top - elementRect.top + 10;
            container.scrollTop -= scrollAmount;
          }
        }
      }, 50);
      return () => clearTimeout(scrollTimeout);
    }
  }, [selectedIndex, results, isScrolling]);

  useEffect(() => {
    const resultsContainer = resultsContainerRef.current;
    if (!resultsContainer) return;
    const handleScroll = () => {
      setIsScrolling(true);
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
  }, [showModal]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    let courseResults: SearchResult[] = [];
    let instructorResults: SearchResult[] = [];
    if (courseData) {
      courseResults = courseData
        .filter((course: MinimalCourseData) =>
          `${course.dept} ${course.number} ${course.title}`
            .toLowerCase()
            .includes(lowerQuery)
        )
        .slice(0, 10)
        .map((course: MinimalCourseData) => ({
          type: "course",
          data: course,
        }));
    }
    if (instructorData) {
      instructorResults = instructorData
        .filter((instructor: MinimalInstructorData) =>
          instructor.name.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .map((instructor: MinimalInstructorData) => ({
          type: "instructor",
          data: instructor,
        }));
    }
    setResults([...courseResults, ...instructorResults]);
    setSelectedIndex(-1);
  }, [query, courseData, instructorData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowModal(true);
      }
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (isScrolling) {
        setIsScrolling(false);
        return;
      }
      setSelectedIndex((prevIndex) => {
        if (prevIndex === -1) {
          return 0;
        } else if (prevIndex < results.length - 1) {
          return prevIndex + 1;
        }
        return prevIndex;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isScrolling) {
        setIsScrolling(false);
        return;
      }
      setSelectedIndex((prevIndex) => {
        if (prevIndex > 0) {
          return prevIndex - 1;
        } else if (prevIndex === 0) {
          searchInputRef.current?.focus();
          return -1;
        }
        return prevIndex;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const result = results[selectedIndex];
        if (result.type === "course") {
          const course = result.data as MinimalCourseData;
          router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
        } else {
          const instructor = result.data as MinimalInstructorData;
          router.push(`/instructors/${encodeURIComponent(instructor.name)}`);
        }
        setShowModal(false);
      } else if (results.length > 0) {
        const result = results[0];
        if (result.type === "course") {
          const course = result.data as MinimalCourseData;
          router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
        } else {
          const instructor = result.data as MinimalInstructorData;
          router.push(`/instructors/${encodeURIComponent(instructor.name)}`);
        }
        setShowModal(false);
      }
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (result.type === "course") {
      const course = result.data as MinimalCourseData;
      router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
    } else {
      const instructor = result.data as MinimalInstructorData;
      router.push(`/instructors/${encodeURIComponent(instructor.name)}`);
    }
    setShowModal(false);
  };

  const handleMouseEnter = (index: number) => {
    setSelectedIndex(index);
  };

  const openSearchModal = () => {
    setSelectedIndex(-1);
    setResults([]);
    setQuery("");
    setShowModal(true);
  };

  const closeSearchModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <div className="global-search-button" onClick={openSearchModal}>
        <Search size={20} />
        <span className="search-label">Search</span>
        <div className="search-shortcut">
          <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
          <span>+</span>
          <kbd>K</kbd>
        </div>
      </div>
      {showModal && (
        <div
          className="global-search-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSearchModal();
          }}
        >
          <div className="global-search-modal-content" ref={modalRef}>
            <div className="global-search-header">
              <h3>Search</h3>
              <Button
                label="Close"
                onClick={closeSearchModal}
                type="secondary"
                className="close-btn"
              />
            </div>
            <div className="global-search-input">
              <SearchBar
                handleInputChange={setQuery}
                searchSelected={true}
                setSearchSelected={() => {}}
                placeholder="course code, title, or instructor name"
                value={query}
                onKeyDown={handleKeyDown}
                className="modal-search"
                ref={searchInputRef}
              />
            </div>
            <div className="global-search-results" ref={resultsContainerRef}>
              {isLoadingCourses || isLoadingInstructors ? (
                <div className="search-loading">Loading...</div>
              ) : query.length < 2 ? (
                <div className="search-hint">
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
              ) : results.length > 0 ? (
                <ul className="search-results-list">
                  {results.map((result, index) => (
                    <li
                      key={
                        result.type === "course"
                          ? `${result.data.dept}${result.data.number}`
                          : result.data.name
                      }
                      className={index === selectedIndex ? "selected" : ""}
                      ref={index === selectedIndex ? selectedItemRef : null}
                      data-index={index}
                    >
                      <button
                        className="search-result-item"
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => handleMouseEnter(index)}
                        style={{ width: "100%", textAlign: "left" }}
                      >
                        {result.type === "course" ? (
                          <p>
                            <span className="course-code">
                              {result.data.dept} {result.data.number}
                            </span>
                            <span className="course-title">
                              {" "}
                              - {result.data.title}
                            </span>
                          </p>
                        ) : (
                          <InstructorCard
                            instructor={result.data}
                            query={query}
                          />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-results">
                  No results found for &quot;{query}&quot;
                </div>
              )}
            </div>
            <div className="global-search-footer">
              <Link
                href="/explore"
                className="browse-all-link"
                onClick={closeSearchModal}
              >
                Explore all
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
