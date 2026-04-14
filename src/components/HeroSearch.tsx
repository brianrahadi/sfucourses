// src/components/HeroSearch.tsx
import React, { useState, useEffect, useRef } from "react";
import { SearchBar } from "./SearchBar";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { getCourseAPIData } from "@utils";
import Link from "next/link";

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

export const HeroSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: courseData } = useQuery({
    queryKey: ["globalSearchIndex"],
    queryFn: async () => {
      try {
        const response = await getCourseAPIData("/outlines");
        return response.map((course: any) => ({
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

  const { data: instructorData } = useQuery({
    queryKey: ["globalInstructorSearchIndex"],
    queryFn: async () => {
      try {
        const response = await getCourseAPIData("/instructors");
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter results
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
        .slice(0, 50)
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
        .slice(0, 50)
        .map((instructor: MinimalInstructorData) => ({
          type: "instructor",
          data: instructor,
        }));
    }
    setResults([...courseResults, ...instructorResults]);
    setSelectedIndex(-1);
  }, [query, courseData, instructorData]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `li:nth-child(${selectedIndex + 1})`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const navigateToResult = (result: SearchResult) => {
    if (result.type === "course") {
      const course = result.data as MinimalCourseData;
      router.push(`/explore/${course.dept.toLowerCase()}-${course.number}`);
    } else {
      const instructor = result.data as MinimalInstructorData;
      router.push(`/instructors/${encodeURIComponent(instructor.name)}`);
    }
    setIsFocused(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        navigateToResult(results[selectedIndex]);
      } else if (results.length > 0) {
        navigateToResult(results[0]);
      }
    } else if (e.key === "Escape") {
      setIsFocused(false);
      searchInputRef.current?.blur();
    }
  };

  const showDropdown = isFocused && query.length >= 2;

  return (
    <div className="hero-search" ref={containerRef}>
      <SearchBar
        ref={searchInputRef}
        handleInputChange={(value) => {
          setQuery(value);
          setIsFocused(true);
        }}
        searchSelected={isFocused}
        setSearchSelected={(selected) => setIsFocused(selected)}
        placeholder="search courses and instructors"
        value={query}
        onKeyDown={handleKeyDown}
        className="hero-search__input"
      />
      {showDropdown && (
        <div className="hero-search__dropdown" ref={resultsRef}>
          {results.length > 0 ? (
            <ul className="hero-search__results">
              {results.map((result, index) => (
                <li
                  key={
                    result.type === "course"
                      ? `${result.data.dept}${
                          (result.data as MinimalCourseData).number
                        }`
                      : (result.data as MinimalInstructorData).name
                  }
                  className={index === selectedIndex ? "selected" : ""}
                >
                  <button
                    className="hero-search__result-item"
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {result.type === "course" ? (
                      <>
                        <span className="result-code">
                          {(result.data as MinimalCourseData).dept}{" "}
                          {(result.data as MinimalCourseData).number}
                        </span>
                        <span className="result-title">
                          {" "}
                          — {(result.data as MinimalCourseData).title}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="result-code">
                          {(result.data as MinimalInstructorData).name}
                        </span>
                        <span className="result-title"> — Instructor</span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="hero-search__no-results">
              No results found for &quot;{query}&quot;
            </div>
          )}
          <div className="hero-search__footer">
            <Link
              href="/explore"
              className="hero-search__explore-link"
              onClick={() => setIsFocused(false)}
            >
              Explore all courses →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroSearch;
