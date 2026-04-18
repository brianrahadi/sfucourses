import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CourseOutline, CourseWithSectionDetails, Review } from "../types";
import { RedditPosts, ReviewsAndPostsTabs, ReviewCharts } from "@components";
import { getCourseAPIData } from "@utils";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { BASE_URL } from "@const";
import { RotatingLines } from "react-loader-spinner";

// Cache for course outline data
const courseOutlineCache = new Map<string, CourseOutline>();

interface CourseReviewData {
  course_code: string;
  total_reviews: number;
  instructors: InstructorSummary[];
}

interface InstructorSummary {
  professor_id: string;
  professor_name: string;
  department: string;
  avg_rating: number;
  avg_difficulty: number;
  review_count: number;
  would_take_again: string;
  reviews: Review[];
}

interface SidebarCourseProps {
  course: CourseOutline | CourseWithSectionDetails;
  onClose: () => void;
  isPinned?: boolean;
}

const useCourseOutline = (course: CourseOutline | CourseWithSectionDetails) => {
  const [courseOutline, setCourseOutline] = useState<CourseOutline | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ("description" in course) {
      setCourseOutline(course as CourseOutline);
      return;
    }

    const cacheKey = `${course.dept}-${course.number}`;

    // Check cache first
    if (courseOutlineCache.has(cacheKey)) {
      setCourseOutline(courseOutlineCache.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    getCourseAPIData(`/outlines?dept=${course.dept}&number=${course.number}`)
      .then((res) => {
        const outline = res[0] || null;
        if (outline) {
          // Cache the result
          courseOutlineCache.set(cacheKey, outline);
        }
        setCourseOutline(outline);
      })
      .catch(() => {
        setCourseOutline(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [course.dept, course.number]);

  return { courseOutline, isLoading };
};

export const SidebarCourse: React.FC<SidebarCourseProps> = ({
  course,
  onClose,
  isPinned = false,
}) => {
  const { courseOutline, isLoading } = useCourseOutline(course);

  // Course review state
  const [courseReviewData, setCourseReviewData] =
    useState<CourseReviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [selectedInstructorFilter, setSelectedInstructorFilter] =
    useState("all");
  const [selectedSortOption, setSelectedSortOption] = useState("most-recent");

  const reviewsPerPage = 5;

  // Fetch course review data
  const fetchCourseReviews = useCallback(async () => {
    const courseCodeStr = `${course.dept.toUpperCase()}${course.number}`;
    setReviewLoading(true);
    setReviewError(null);
    setCourseReviewData(null);
    setDisplayedReviews([]);

    try {
      const data = await getCourseAPIData(`/reviews/courses/${courseCodeStr}`);
      setCourseReviewData(data);

      // Initialize displayed reviews with first page
      const allReviews = data.instructors.flatMap(
        (instructor: InstructorSummary) => instructor.reviews
      );
      setDisplayedReviews(allReviews.slice(0, reviewsPerPage));
    } catch (err) {
      setReviewError("No reviews found for this course");
      setCourseReviewData(null);
      setDisplayedReviews([]);
    } finally {
      setReviewLoading(false);
    }
  }, [course.dept, course.number, reviewsPerPage]);

  // Get instructors with review counts
  const getInstructorsWithCounts = useCallback(() => {
    if (!courseReviewData?.instructors) return [];

    return courseReviewData.instructors
      .map((instructor) => ({
        instructorName: instructor.professor_name,
        count: instructor.review_count,
      }))
      .sort((a, b) => a.instructorName.localeCompare(b.instructorName));
  }, [courseReviewData]);

  // Get filtered reviews based on instructor selection
  const getFilteredReviews = useCallback(() => {
    if (!courseReviewData?.instructors) return [];

    const allReviews = courseReviewData.instructors.flatMap((instructor) =>
      instructor.reviews.map((review) => ({
        ...review,
        instructor_name: instructor.professor_name,
      }))
    );

    let filteredReviews = allReviews;

    if (selectedInstructorFilter !== "all") {
      filteredReviews = allReviews.filter(
        (review) => review.instructor_name === selectedInstructorFilter
      );
    }

    // Helper function to parse date strings more reliably
    const parseDate = (dateStr: string): Date => {
      // Handle formats like "Aug 19th, 2025" or "Sep 1st, 2020"
      const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");
      const parsed = new Date(cleaned);
      return isNaN(parsed.getTime()) ? new Date(0) : parsed;
    };

    // Sort reviews based on selected sort option
    switch (selectedSortOption) {
      case "most-recent":
        filteredReviews.sort((a, b) => {
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case "least-recent":
        filteredReviews.sort((a, b) => {
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case "hardest":
        filteredReviews.sort((a, b) => {
          const difficultyA = parseFloat(a.difficulty);
          const difficultyB = parseFloat(b.difficulty);
          // Primary sort by difficulty (highest first)
          if (difficultyA !== difficultyB) {
            return difficultyB - difficultyA;
          }
          // Secondary sort by latest date
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case "easiest":
        filteredReviews.sort((a, b) => {
          const difficultyA = parseFloat(a.difficulty);
          const difficultyB = parseFloat(b.difficulty);
          // Primary sort by difficulty (lowest first)
          if (difficultyA !== difficultyB) {
            return difficultyA - difficultyB;
          }
          // Secondary sort by latest date
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case "most-liked":
        filteredReviews.sort((a, b) => {
          const helpfulA = parseInt(a.helpful) || 0;
          const helpfulB = parseInt(b.helpful) || 0;
          // Primary sort by helpful votes (highest first)
          if (helpfulA !== helpfulB) {
            return helpfulB - helpfulA;
          }
          // Secondary sort by latest date
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case "most-disliked":
        filteredReviews.sort((a, b) => {
          const notHelpfulA = parseInt(a.not_helpful) || 0;
          const notHelpfulB = parseInt(b.not_helpful) || 0;
          // Primary sort by not helpful votes (highest first)
          if (notHelpfulA !== notHelpfulB) {
            return notHelpfulB - notHelpfulA;
          }
          // Secondary sort by latest date
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      default:
        break;
    }

    return filteredReviews;
  }, [courseReviewData, selectedInstructorFilter, selectedSortOption]);

  // Get filter stats for current selection
  const getFilterStats = useCallback(() => {
    const filteredReviews = getFilteredReviews();

    if (filteredReviews.length === 0) {
      return { avgRating: 0, avgDifficulty: 0 };
    }

    const totalRating = filteredReviews.reduce(
      (sum, review) => sum + parseFloat(review.rating),
      0
    );
    const totalDifficulty = filteredReviews.reduce(
      (sum, review) => sum + parseFloat(review.difficulty),
      0
    );

    return {
      avgRating: totalRating / filteredReviews.length,
      avgDifficulty: totalDifficulty / filteredReviews.length,
    };
  }, [getFilteredReviews]);

  // Load more reviews
  const loadMoreReviews = useCallback(() => {
    const filteredReviews = getFilteredReviews();
    const startIndex = reviewsPage * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    const newReviews = filteredReviews.slice(startIndex, endIndex);

    if (newReviews.length > 0) {
      setDisplayedReviews((prev) => [...prev, ...newReviews]);
      setReviewsPage((prev) => prev + 1);
    }
  }, [getFilteredReviews, reviewsPage, reviewsPerPage]);

  // Get chart data for rating and difficulty distribution
  const getChartData = useCallback(() => {
    if (!courseReviewData?.instructors) {
      return {
        ratingData: Array.from({ length: 5 }, (_, i) => ({
          rating: (i + 1).toString(),
          count: 0,
        })),
        difficultyData: Array.from({ length: 5 }, (_, i) => ({
          difficulty: (i + 1).toString(),
          count: 0,
        })),
      };
    }

    const allReviews = courseReviewData.instructors.flatMap(
      (instructor) => instructor.reviews
    );

    // Initialize rating distribution (1-5)
    const ratingDistribution = Array.from({ length: 5 }, (_, i) => ({
      rating: (i + 1).toString(),
      count: 0,
    }));

    // Initialize difficulty distribution (1-5)
    const difficultyDistribution = Array.from({ length: 5 }, (_, i) => ({
      difficulty: (i + 1).toString(),
      count: 0,
    }));

    // Count ratings and difficulties
    allReviews.forEach((review) => {
      const rating = Math.round(parseFloat(review.rating));
      const difficulty = Math.round(parseFloat(review.difficulty));

      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating - 1].count++;
      }

      if (difficulty >= 1 && difficulty <= 5) {
        difficultyDistribution[difficulty - 1].count++;
      }
    });

    return {
      ratingData: ratingDistribution,
      difficultyData: difficultyDistribution,
    };
  }, [courseReviewData]);

  // Fetch course reviews immediately
  useEffect(() => {
    fetchCourseReviews();
  }, [fetchCourseReviews]);

  // Update displayed reviews when filter or sort changes
  useEffect(() => {
    if (courseReviewData) {
      const filteredReviews = getFilteredReviews();
      setDisplayedReviews(filteredReviews.slice(0, reviewsPerPage));
      setReviewsPage(1);
    }
  }, [
    selectedInstructorFilter,
    selectedSortOption,
    courseReviewData,
    getFilteredReviews,
    reviewsPerPage,
  ]);

  if (isLoading) {
    return (
      <div className="course-details-inline">
        <div className="back-arrow" onClick={onClose}>
          <IoArrowBackOutline className="back-arrow-icon" />
        </div>
        <div className="course-info">
          <p>Loading course information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-details-inline">
      <div className="back-arrow" onClick={onClose}>
        <IoArrowBackOutline className="back-arrow-icon" />
      </div>
      <Link
        href={`/explore/${course.dept.toLowerCase()}-${course.number}`}
        target="_blank"
        rel="noreferrer"
        className="course-info-header"
      >
        {course.dept.toUpperCase()} {course.number}{" "}
        {courseOutline?.units ? `(${courseOutline.units})` : ""}
      </Link>
      <div className="course-info">
        {courseOutline ? (
          <>
            <h3>{courseOutline.title}</h3>
            <p>{courseOutline.description}</p>
            {courseOutline.notes && <p>{courseOutline.notes}</p>}
            <p>
              Prerequisites:{" "}
              {courseOutline.prerequisites !== ""
                ? courseOutline.prerequisites
                : "None"}
            </p>
          </>
        ) : (
          <p>Course outline not available for this term.</p>
        )}
      </div>

      {/* Course Review Charts */}
      {courseReviewData &&
        (() => {
          const allReviews = courseReviewData.instructors.flatMap(
            (instructor) => instructor.reviews
          );
          let totalRating = 0;
          let totalDiff = 0;
          if (allReviews.length > 0) {
            totalRating =
              allReviews.reduce(
                (sum, review) => sum + parseFloat(review.rating),
                0
              ) / allReviews.length;
            totalDiff =
              allReviews.reduce(
                (sum, review) => sum + parseFloat(review.difficulty),
                0
              ) / allReviews.length;
          }
          return (
            <ReviewCharts
              ratingData={getChartData().ratingData}
              difficultyData={getChartData().difficultyData}
              totalReviews={courseReviewData.total_reviews}
              overallRating={totalRating}
              overallDifficulty={totalDiff}
              height={120}
              fontSize={10}
            />
          );
        })()}

      {/* Reviews and Posts Tabs */}
      <ReviewsAndPostsTabs
        context="course"
        reviewData={courseReviewData ? { reviews: getFilteredReviews() } : null}
        reviewLoading={reviewLoading}
        reviewError={reviewError}
        displayedReviews={displayedReviews}
        onLoadMoreReviews={loadMoreReviews}
        getCourseCodesWithCounts={() =>
          getInstructorsWithCounts().map((item) => ({
            courseCode: item.instructorName,
            count: item.count,
          }))
        }
        getFilterStats={getFilterStats}
        selectedCourseFilter={selectedInstructorFilter}
        onCourseFilterChange={setSelectedInstructorFilter}
        selectedSortOption={selectedSortOption}
        onSortOptionChange={setSelectedSortOption}
        className="sidebar"
      />
    </div>
  );
};
