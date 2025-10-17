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
        `http://localhost:8080/v1/rest/reviews/courses/${courseCodeStr}`
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

    return courseReviewData.instructors.map((instructor) => ({
      instructorName: instructor.professor_name,
      count: instructor.review_count,
    }));
  }, [courseReviewData]);

  // Get filtered reviews based on instructor selection
  const getFilteredReviews = useCallback(() => {
    if (!courseReviewData?.instructors) return [];

    const allReviews = courseReviewData.instructors.flatMap(
      (instructor) => instructor.reviews
    );

    if (selectedInstructorFilter === "all") {
      return allReviews;
    }

    const selectedInstructor = courseReviewData.instructors.find(
      (instructor) => instructor.professor_name === selectedInstructorFilter
    );

    return selectedInstructor ? selectedInstructor.reviews : [];
  }, [courseReviewData, selectedInstructorFilter]);

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

  // Update displayed reviews when filter changes
  useEffect(() => {
    if (courseReviewData) {
      const filteredReviews = getFilteredReviews();
      setDisplayedReviews(filteredReviews.slice(0, reviewsPerPage));
      setReviewsPage(1);
    }
  }, [
    selectedInstructorFilter,
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
        />
      </main>
    </div>
  );
};

export default CoursePage;
