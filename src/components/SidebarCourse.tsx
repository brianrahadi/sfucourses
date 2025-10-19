import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CourseOutline, CourseWithSectionDetails, Review } from "../types";
import { RedditPosts, ReviewsAndPostsTabs } from "@components";
import { getCourseAPIData } from "@utils";
import { IoArrowBackOutline } from "react-icons/io5";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
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

interface RedditPostData {
  title: string;
  upvotes: number;
  date_created: Date;
  url: string;
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

  // Reddit posts state
  const [redditPosts, setRedditPosts] = useState<RedditPostData[]>([]);
  const [redditLoading, setRedditLoading] = useState(true);
  const [redditError, setRedditError] = useState<string | null>(null);
  const [displayedRedditPosts, setDisplayedRedditPosts] = useState<
    RedditPostData[]
  >([]);
  const [redditPage, setRedditPage] = useState(1);

  const reviewsPerPage = 5;
  const redditPerPage = 5;

  // Fetch course review data
  const fetchCourseReviews = useCallback(async () => {
    if (!courseOutline) return;

    const courseCodeStr = `${courseOutline.dept.toUpperCase()}${
      courseOutline.number
    }`;
    setReviewLoading(true);
    setReviewError(null);

    try {
      const response = await fetch(
        `${BASE_URL}/reviews/courses/${courseCodeStr}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch course reviews");
      }
      const data = await response.json();
      setCourseReviewData(data);

      // Initialize displayed reviews with first page
      const allReviews = data.instructors.flatMap(
        (instructor: InstructorSummary) => instructor.reviews
      );
      setDisplayedReviews(allReviews.slice(0, reviewsPerPage));
    } catch (err) {
      setReviewError("Failed to load course reviews");
    } finally {
      setReviewLoading(false);
    }
  }, [courseOutline, reviewsPerPage]);

  // Fetch Reddit posts
  const fetchRedditPosts = useCallback(async () => {
    if (!courseOutline) return;

    const query = `${courseOutline.dept.toLowerCase()} ${courseOutline.number}`;
    setRedditLoading(true);
    setRedditError(null);

    try {
      const response = await fetch(
        `/api/reddit?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Reddit posts");
      }
      const data = await response.json();
      setRedditPosts(data);

      // Initialize displayed posts with first page
      setDisplayedRedditPosts(data.slice(0, redditPerPage));
    } catch (err) {
      setRedditError("Failed to load Reddit posts");
    } finally {
      setRedditLoading(false);
    }
  }, [courseOutline, redditPerPage]);

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

  // Load more Reddit posts
  const loadMoreRedditPosts = useCallback(() => {
    const startIndex = redditPage * redditPerPage;
    const endIndex = startIndex + redditPerPage;
    const newPosts = redditPosts.slice(startIndex, endIndex);

    if (newPosts.length > 0) {
      setDisplayedRedditPosts((prev) => [...prev, ...newPosts]);
      setRedditPage((prev) => prev + 1);
    }
  }, [redditPosts, redditPage, redditPerPage]);

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

  // Fetch course reviews and Reddit posts when course outline is available
  useEffect(() => {
    if (courseOutline) {
      fetchCourseReviews();
      fetchRedditPosts();
    }
  }, [courseOutline, fetchCourseReviews, fetchRedditPosts]);

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

  if (!courseOutline) {
    return (
      <div className="course-details-inline">
        <div className="back-arrow" onClick={onClose}>
          <IoArrowBackOutline className="back-arrow-icon" />
        </div>
        <div className="course-info">
          <p>Course information not available</p>
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
        href={`/explore/${courseOutline.dept.toLowerCase()}-${
          courseOutline.number
        }`}
        target="_blank"
        rel="noreferrer"
        className="course-info-header"
      >
        {courseOutline.dept} {courseOutline.number} ({courseOutline.units})
      </Link>
      <div className="course-info">
        <h3>{courseOutline.title}</h3>
        <p>{courseOutline.description}</p>
        {courseOutline.notes && <p>{courseOutline.notes}</p>}
        <p>
          Prerequisites:{" "}
          {courseOutline.prerequisites !== ""
            ? courseOutline.prerequisites
            : "None"}
        </p>
      </div>

      {/* Course Review Summary Stats */}
      {courseReviewData && (
        <div className="course-review-summary">
          <div className="review-stats">
            <div className="stat-item">
              <span className="stat-value">
                {(
                  courseReviewData.instructors.reduce(
                    (sum, instructor) => sum + instructor.avg_rating,
                    0
                  ) / courseReviewData.instructors.length
                ).toFixed(2)}
                /5
              </span>
              <span className="stat-label">Overall Rating</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {(
                  courseReviewData.instructors.reduce(
                    (sum, instructor) => sum + instructor.avg_difficulty,
                    0
                  ) / courseReviewData.instructors.length
                ).toFixed(2)}
                /5
              </span>
              <span className="stat-label">Overall Difficulty</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {courseReviewData.total_reviews}
              </span>
              <span className="stat-label">Total Reviews</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {courseReviewData.instructors.length}
              </span>
              <span className="stat-label">Instructors</span>
            </div>
          </div>
        </div>
      )}

      {/* Course Review Charts */}
      {courseReviewData && (
        <div className="course-charts-section">
          <div className="course-charts">
            <div className="chart-container">
              <h3>Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={getChartData().ratingData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--colour-neutral-800)"
                  />
                  <XAxis
                    dataKey="rating"
                    stroke="var(--colour-neutral-400)"
                    fontSize={10}
                  />
                  <YAxis stroke="var(--colour-neutral-400)" fontSize={10} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "var(--colour-neutral-1100)",
                      border: "1px solid var(--colour-neutral-800)",
                      borderRadius: "0.5rem",
                      color: "var(--colour-neutral-200)",
                    }}
                    formatter={(value: number) => [
                      `${value} (${(
                        (value / courseReviewData.total_reviews) *
                        100
                      ).toFixed(0)}%)`,
                      "Count",
                    ]}
                    labelFormatter={(label: string) => ``}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--colour-sosy-green-500)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-container">
              <h3>Difficulty Distribution</h3>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={getChartData().difficultyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--colour-neutral-800)"
                  />
                  <XAxis
                    dataKey="difficulty"
                    stroke="var(--colour-neutral-400)"
                    fontSize={10}
                  />
                  <YAxis stroke="var(--colour-neutral-400)" fontSize={10} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "var(--colour-neutral-1100)",
                      border: "1px solid var(--colour-neutral-800)",
                      borderRadius: "0.5rem",
                      color: "var(--colour-neutral-200)",
                    }}
                    formatter={(value: number) => [
                      `${value} (${(
                        (value / courseReviewData.total_reviews) *
                        100
                      ).toFixed(0)}%)`,
                      "Count",
                    ]}
                    labelFormatter={(label: string) => ``}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--colour-neutral-500)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Reviews and Posts Tabs */}
      <ReviewsAndPostsTabs
        context="course"
        reviewData={courseReviewData ? { reviews: getFilteredReviews() } : null}
        reviewLoading={reviewLoading}
        reviewError={reviewError}
        redditPosts={redditPosts}
        redditLoading={redditLoading}
        redditError={redditError}
        displayedReviews={displayedReviews}
        displayedRedditPosts={displayedRedditPosts}
        onLoadMoreReviews={loadMoreReviews}
        onLoadMoreRedditPosts={loadMoreRedditPosts}
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
