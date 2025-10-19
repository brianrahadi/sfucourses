import {
  CourseTabContainer,
  Helmet,
  Hero,
  RedditPosts,
  SectionDetails,
  ReviewsAndPostsTabs,
} from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState, useCallback, useRef } from "react";
import { getCourseAPIData, loadCourseAPIData } from "@utils";
import { CourseOutline, Review } from "@types";
import { useRouter } from "next/router";
import { useCourseOfferings } from "@hooks";
import { RotatingLines } from "react-loader-spinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BASE_URL } from "@const";

interface CoursePageProps {}

interface CourseCode {
  dept: string | undefined;
  number: string | undefined;
}

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

const CoursePage: React.FC<CoursePageProps> = () => {
  const router = useRouter();
  const { code } = router.query;

  const courseStrs =
    typeof code === "string" ? code.toLowerCase().split("-") : [];
  const courseCode: CourseCode = {
    dept: courseStrs[0] || undefined,
    number: courseStrs[1] || undefined,
  };

  const [course, setCourse] = useState<CourseOutline | undefined>();
  const [showInvalid, setShowInvalid] = useState(false);

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
    if (!courseCode.dept || !courseCode.number) return;

    const courseCodeStr = `${courseCode.dept.toUpperCase()}${
      courseCode.number
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
  }, [courseCode.dept, courseCode.number, reviewsPerPage]);

  // Fetch Reddit posts
  const fetchRedditPosts = useCallback(async () => {
    if (!courseCode.dept || !courseCode.number) return;

    const query = `${courseCode.dept.toLowerCase()} ${courseCode.number}`;
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
  }, [courseCode.dept, courseCode.number, redditPerPage]);

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

  useEffect(() => {
    if (courseCode.dept && courseCode.number) {
      getCourseAPIData(
        `/outlines?dept=${courseCode.dept}&number=${courseCode.number}`
      ).then((res) => {
        setCourse(res[0]);
      });

      // Fetch course reviews and Reddit posts
      fetchCourseReviews();
      fetchRedditPosts();
    }
  }, [
    courseCode.dept,
    courseCode.number,
    fetchCourseReviews,
    fetchRedditPosts,
  ]);

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

  useEffect(() => {
    if (!courseCode.dept || !courseCode.number) {
      const timer = setTimeout(() => setShowInvalid(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowInvalid(false);
    }
  }, [courseCode.dept, courseCode.number]);

  const { offerings, isLoadingOfferings, errorOfferings, isIdleOfferings } =
    useCourseOfferings(course);

  const [showAllSectionsMap, setShowAllSectionsMap] = useState<
    Record<string, boolean>
  >({});
  const [showLabTutMap, setShowLabTutMap] = useState<Record<string, boolean>>(
    {}
  );

  if (showInvalid) {
    return (
      <div className="page courses-page">
        <Hero title="explore courses" backgroundImage={HeroImage.src} />
        <main className="container">
          <div className="center">
            <h2>Whoopsie! Invalid course code provided</h2>
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page courses-page">
        <Hero title="explore courses" backgroundImage={HeroImage.src} />
        <main className="container">
          <div className="center loading-spinner-container">
            <RotatingLines visible={true} strokeColor="#24a98b" />
          </div>
        </main>
      </div>
    );
  }

  // Prepare tabs for the TabContainer
  const tabs = offerings.map((offering) => {
    const key = offering.term;

    return {
      id: offering.term,
      label: offering.term,
      content: (
        <SectionDetails
          offering={offering}
          showAllSections={!!showAllSectionsMap[key]}
          onToggleShowAllSections={() =>
            setShowAllSectionsMap((prev) => ({
              ...prev,
              [key]: !prev[key],
            }))
          }
          showLabTut={!!showLabTutMap[key]}
          onToggleShowLabTut={() =>
            setShowLabTutMap((prev) => ({
              ...prev,
              [key]: !prev[key],
            }))
          }
        />
      ),
    };
  });

  return (
    <div className="page courses-page">
      <Helmet pageTitle={`${course.dept.toLowerCase()} ${course.number}`} />
      <Hero
        title={`${course.dept.toLowerCase()} ${course.number} @ sfucourses`}
        backgroundImage={HeroImage.src}
      />
      <main className="container course-container">
        <div className="course-top-container">
          <div className="course-left-section">
            <div className="course-page-card">
              <div className="course-title">
                {`${course.dept} ${course.number} - ${course.title}${
                  course.units && course.units !== "0" && course.units !== "N/A"
                    ? ` (${course.units})`
                    : ""
                }`}
              </div>
              <div className="course-page-card__connt">
                <p className="course-description">
                  {course.description}
                  {course.designation && course.designation != "N/A"
                    ? " " + course.designation
                    : ""}
                </p>
                <p className="course-description">
                  Prerequisite: {course.prerequisites || "N/A"}
                </p>
              </div>
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
            <div className="course-offerings">
              {isLoadingOfferings || isIdleOfferings ? (
                <div className="loading-spinner-container">
                  <RotatingLines visible={true} strokeColor="#24a98b" />
                </div>
              ) : errorOfferings ? (
                `Error loading offerings: ${errorOfferings.message}`
              ) : offerings.length === 0 ? (
                "No offerings available"
              ) : (
                <CourseTabContainer tabs={tabs} />
              )}
            </div>
          </div>
          <div className="prerequisites-visualization">
            {/* Course Review Charts */}
            {courseReviewData && (
              <div className="course-charts-section">
                <div className="course-charts">
                  <div className="chart-container">
                    <h3>Rating Distribution</h3>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={getChartData().ratingData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--colour-neutral-800)"
                        />
                        <XAxis
                          dataKey="rating"
                          stroke="var(--colour-neutral-400)"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="var(--colour-neutral-400)"
                          fontSize={12}
                        />
                        <Tooltip
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
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={getChartData().difficultyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--colour-neutral-800)"
                        />
                        <XAxis
                          dataKey="difficulty"
                          stroke="var(--colour-neutral-400)"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="var(--colour-neutral-400)"
                          fontSize={12}
                        />
                        <Tooltip
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

            <iframe
              src={`https://prerequisites-visualization.vercel.app/sfu/courses/${course.dept.toLowerCase()}/${
                course.number
              }`}
              style={{ width: "100%", height: "600px", border: "none" }}
              title="Prerequisites Visualization"
            ></iframe>
          </div>
        </div>

        {/* Reviews and Posts Tabs */}
        <ReviewsAndPostsTabs
          context="course"
          reviewData={
            courseReviewData ? { reviews: getFilteredReviews() } : null
          }
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
        />
      </main>
    </div>
  );
};

export default CoursePage;
