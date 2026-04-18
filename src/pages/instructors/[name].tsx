import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import {
  Instructor,
  InstructorOffering,
  InstructorReviewData,
  Review,
} from "@types";
import { getCourseAPIData } from "@utils";
import { Helmet, ReviewsAndPostsTabs } from "@components";
import { RotatingLines } from "react-loader-spinner";
import Link from "next/link";
import { termToIcon } from "@utils/exploreFilters";
import { ReviewCharts } from "@components";
import {
  INSTRUCTOR_RMP_NAME_MAPPING,
  INSTRUCTOR_REDIRECT_NAME_MAPPING,
} from "@const";

const InstructorPage = () => {
  const router = useRouter();
  let { name } = router.query;
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [reviewData, setReviewData] = useState<InstructorReviewData | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);

  const [reviewsPage, setReviewsPage] = useState(1);

  const [selectedCourseFilter, setSelectedCourseFilter] =
    useState<string>("all");
  const [selectedSortOption, setSelectedSortOption] = useState("most-recent");
  const reviewsPerPage = 5;

  // Get course codes with review counts
  const getCourseCodesWithCounts = useCallback(() => {
    if (!reviewData?.reviews) return [];

    const courseCounts = reviewData.reviews.reduce((acc, review) => {
      acc[review.course_code] = (acc[review.course_code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(courseCounts)
      .map(([courseCode, count]) => ({ courseCode, count }))
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  }, [reviewData?.reviews]);

  // Filter reviews based on selected course
  const getFilteredReviews = useCallback(() => {
    if (!reviewData?.reviews) return [];

    let filteredReviews = reviewData.reviews;

    if (selectedCourseFilter !== "all") {
      filteredReviews = reviewData.reviews.filter(
        (review) => review.course_code === selectedCourseFilter
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
  }, [reviewData?.reviews, selectedCourseFilter, selectedSortOption]);

  // Get average rating and difficulty for current filter
  const getFilterStats = useCallback(() => {
    const filteredReviews = getFilteredReviews();
    if (filteredReviews.length === 0) return { avgRating: 0, avgDifficulty: 0 };

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

  // Get chart data for rating and difficulty distribution
  const getChartData = useCallback(() => {
    if (!reviewData?.reviews) return { ratingData: [], difficultyData: [] };

    const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 ratings
    const difficultyCounts = [0, 0, 0, 0, 0]; // 1-5 difficulty

    reviewData.reviews.forEach((review) => {
      const rating = Math.round(parseFloat(review.rating));
      const difficulty = Math.round(parseFloat(review.difficulty));

      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating - 1]++;
      }
      if (difficulty >= 1 && difficulty <= 5) {
        difficultyCounts[difficulty - 1]++;
      }
    });

    const ratingData = ratingCounts.map((count, index) => ({
      rating: index + 1,
      count,
    }));

    const difficultyData = difficultyCounts.map((count, index) => ({
      difficulty: index + 1,
      count,
    }));

    return { ratingData, difficultyData };
  }, [reviewData?.reviews]);

  const fetchInstructorReviews = useCallback(async (instructorName: string) => {
    try {
      const reviewName =
        INSTRUCTOR_RMP_NAME_MAPPING[instructorName] || instructorName;
      const formattedName = reviewName.replace(/\s+/g, "_");
      return await getCourseAPIData(`/reviews/instructors/${formattedName}`);
    } catch (error) {
      throw error;
    }
  }, []);

  // Load more reviews
  const loadMoreReviews = useCallback(() => {
    const filteredReviews = getFilteredReviews();
    if (!filteredReviews.length) return;

    const startIndex = (reviewsPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    const newReviews = filteredReviews.slice(startIndex, endIndex);

    setDisplayedReviews((prev) => [...prev, ...newReviews]);
    setReviewsPage((prev) => prev + 1);
  }, [getFilteredReviews, reviewsPage]);

  useEffect(() => {
    if (!name || typeof name !== "string") return;

    // Check if name should be redirected
    const redirectName = INSTRUCTOR_REDIRECT_NAME_MAPPING[name];
    if (redirectName) {
      router.replace(`/instructors/${encodeURIComponent(redirectName)}`);
      return;
    }

    // Fetch instructor data
    setLoading(true);
    setError(null);
    getCourseAPIData(`/instructors?name=${name}`)
      .then((data) => {
        setInstructor(data[0]);
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not load instructor details");
        setLoading(false);
      });

    // Fetch review data
    setReviewLoading(true);
    setReviewError(null);
    fetchInstructorReviews(name)
      .then((data) => {
        setReviewData(data);
        setReviewLoading(false);
      })
      .catch((err) => {
        setReviewError("Review data not available");
        setReviewLoading(false);
      });
  }, [name, fetchInstructorReviews, router]);

  // Initialize displayed items when data changes
  useEffect(() => {
    const filteredReviews = getFilteredReviews();
    if (filteredReviews.length > 0) {
      const initialReviews = filteredReviews.slice(0, reviewsPerPage);
      setDisplayedReviews(initialReviews);
      setReviewsPage(2);
    } else {
      setDisplayedReviews([]);
      setReviewsPage(1);
    }
  }, [
    reviewData,
    selectedCourseFilter,
    selectedSortOption,
    getFilteredReviews,
  ]);

  return (
    <div className="page courses-page">
      <Helmet
        pageTitle={`${
          instructor ? `${instructor.name} @ sfucourses` : "instructor details"
        }`}
      />
      <main className="container course-container">
        {loading ? (
          <div className="center loading-spinner-container">
            <RotatingLines visible={true} strokeColor="#24a98b" />
          </div>
        ) : error ? (
          <div className="center">
            <h2>{error}</h2>
          </div>
        ) : instructor ? (
          <>
            <div className="course-main-header">
              <div
                className="course-page-card"
                style={{
                  alignSelf: "stretch",
                  justifyContent: "space-between",
                }}
              >
                <div className="course-header-row">
                  <span className="course-code-title">{instructor.name}</span>
                </div>
                {reviewData && reviewData.department && (
                  <div className="course-title">{reviewData.department}</div>
                )}
                <div
                  className="course-page-card__connt"
                  style={{ marginTop: "auto", paddingBottom: "0.5rem" }}
                >
                  {reviewData && (
                    <p className="course-reviews-count">
                      {reviewData.total_ratings} reviews •{" "}
                      {reviewData.would_take_again}% would take again
                    </p>
                  )}
                </div>
              </div>

              {reviewData && (
                <ReviewCharts
                  ratingData={getChartData().ratingData}
                  difficultyData={getChartData().difficultyData}
                  totalReviews={parseInt(reviewData.total_ratings || "0", 10)}
                  overallRating={parseFloat(reviewData.overall_rating || "0")}
                  overallDifficulty={parseFloat(
                    reviewData.difficulty_level || "0"
                  )}
                />
              )}
            </div>

            <div className="course-bottom-container">
              <div className="course-bottom-left">
                {/* Reviews and Posts Tabs */}
                <ReviewsAndPostsTabs
                  context="instructor"
                  reviewData={
                    reviewData ? { reviews: getFilteredReviews() } : null
                  }
                  reviewLoading={reviewLoading}
                  reviewError={reviewError}
                  displayedReviews={displayedReviews}
                  onLoadMoreReviews={loadMoreReviews}
                  getCourseCodesWithCounts={getCourseCodesWithCounts}
                  getFilterStats={getFilterStats}
                  selectedCourseFilter={selectedCourseFilter}
                  onCourseFilterChange={setSelectedCourseFilter}
                  selectedSortOption={selectedSortOption}
                  onSortOptionChange={setSelectedSortOption}
                />
              </div>

              <div className="course-bottom-right">
                {/* <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "bold", color: "white" }}>Courses Taught</h2> */}
                <div className="instructor-offerings-list">
                  {instructor.offerings && instructor.offerings.length > 0 ? (
                    Object.entries(
                      instructor.offerings.reduce((acc, offering) => {
                        if (!acc[offering.term]) acc[offering.term] = [];
                        acc[offering.term].push(offering);
                        return acc;
                      }, {} as Record<string, InstructorOffering[]>)
                    ).map(([term, offerings]) => (
                      <div
                        key={term}
                        className="course-card instructor-card instructor-offering-term-group"
                      >
                        <div className="course-title dark">
                          {termToIcon(term.split(" ")[0])}&nbsp;
                          <b>{term}</b>
                        </div>
                        <div className="course-card__row">
                          {offerings.map((offering) => (
                            <div
                              key={
                                offering.dept + offering.number + offering.term
                              }
                              style={{ width: "100%" }}
                            >
                              <Link
                                href={`/explore/${offering.dept.toLowerCase()}-${
                                  offering.number
                                }`}
                                className="offering-course-link no-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {offering.dept} {offering.number} -{" "}
                                {offering.title}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No course offerings found.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default InstructorPage;
