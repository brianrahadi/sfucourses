import {
  CourseTabContainer,
  Helmet,
  SectionDetails,
  ReviewsAndPostsTabs,
  ReviewCharts,
} from "@components";
import { useCallback, useMemo, useState } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { Review } from "@types";
import { useCourseOfferings } from "@hooks";
import { BoneRegion } from "src/components/bones/BoneShell";
import dynamic from "next/dynamic";

// Only fallback renders need the skeleton, so it's a separate chunk that
// fully generated pages never download.
const CoursePageSkeleton = dynamic(
  () => import("src/components/skeletons/CoursePageSkeleton")
);
import {
  CourseHeaderCard,
  CoursePrerequisites,
} from "src/components/CourseSections";
import {
  CoursePageProps,
  loadCoursePage,
  PAGE_REVALIDATE_SECONDS,
  popularCourseCodes,
  prerenderLimit,
} from "src/lib/pageData";
import {
  reviewAverages,
  reviewDistributions,
  sortReviews,
} from "@utils/reviewSort";

const REVIEWS_PER_PAGE = 5;

// Course pages are generated on first visit and then served from the CDN,
// refreshed in the background at most hourly. The most-reviewed courses are
// generated at build time.
export const getStaticPaths: GetStaticPaths = async () => {
  const limit = prerenderLimit(process.env.PRERENDER_COURSE_PAGES, 100);
  let codes: string[] = [];
  try {
    codes = await popularCourseCodes(limit);
  } catch (err) {
    console.error("Could not list popular courses to prerender:", err);
  }
  return {
    paths: codes.map((code) => ({ params: { code } })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<CoursePageProps> = async ({
  params,
}) => {
  const data = await loadCoursePage(params?.code as string | undefined);
  if (!data) {
    return { notFound: true, revalidate: PAGE_REVALIDATE_SECONDS };
  }
  return { props: data, revalidate: PAGE_REVALIDATE_SECONDS };
};

const CoursePage: React.FC<Partial<CoursePageProps>> = ({
  course,
  reviews,
}) => {
  const router = useRouter();

  // First visit to a course that hasn't been generated yet.
  if (router.isFallback || !course) {
    const code = typeof router.query.code === "string" ? router.query.code : "";
    return (
      <>
        <Helmet pageTitle={code ? code.replace("-", " ") : "course details"} />
        <CoursePageSkeleton />
      </>
    );
  }

  return <CourseView course={course} reviews={reviews ?? null} />;
};

const CourseView: React.FC<Omit<CoursePageProps, "dehydratedState">> = ({
  course,
  reviews: courseReviewData,
}) => {
  const [showPrereqVis, setShowPrereqVis] = useState(false);
  const [selectedInstructorFilter, setSelectedInstructorFilter] =
    useState("all");
  const [selectedSortOption, setSelectedSortOption] = useState("most-recent");
  const [visibleReviews, setVisibleReviews] = useState(REVIEWS_PER_PAGE);

  const reviewError = courseReviewData
    ? null
    : "No reviews found for this course";

  const allReviews: Review[] = useMemo(
    () =>
      courseReviewData?.instructors.flatMap((instructor) =>
        instructor.reviews.map((review) => ({
          ...review,
          instructor_name: instructor.professor_name,
        }))
      ) ?? [],
    [courseReviewData]
  );

  const filteredReviews = useMemo(() => {
    const reviews =
      selectedInstructorFilter === "all"
        ? allReviews
        : allReviews.filter(
            (review) => review.instructor_name === selectedInstructorFilter
          );
    return sortReviews(reviews, selectedSortOption);
  }, [allReviews, selectedInstructorFilter, selectedSortOption]);

  const displayedReviews = useMemo(
    () => filteredReviews.slice(0, visibleReviews),
    [filteredReviews, visibleReviews]
  );

  const loadMoreReviews = useCallback(() => {
    setVisibleReviews((count) =>
      count < filteredReviews.length ? count + REVIEWS_PER_PAGE : count
    );
  }, [filteredReviews.length]);

  const onInstructorFilterChange = (value: string) => {
    setSelectedInstructorFilter(value);
    setVisibleReviews(REVIEWS_PER_PAGE);
  };
  const onSortOptionChange = (value: string) => {
    setSelectedSortOption(value);
    setVisibleReviews(REVIEWS_PER_PAGE);
  };

  const getInstructorsWithCounts = useCallback(
    () =>
      (courseReviewData?.instructors ?? [])
        .map((instructor) => ({
          courseCode: instructor.professor_name,
          count: instructor.review_count,
        }))
        .sort((a, b) => a.courseCode.localeCompare(b.courseCode)),
    [courseReviewData]
  );

  const getFilterStats = useCallback(
    () => reviewAverages(filteredReviews),
    [filteredReviews]
  );

  const charts = useMemo(() => {
    const plain = courseReviewData?.instructors.flatMap((i) => i.reviews) ?? [];
    const { ratingCounts, difficultyCounts } = reviewDistributions(plain);
    const { avgRating, avgDifficulty } = reviewAverages(plain);
    return {
      ratingData: ratingCounts.map((count, i) => ({
        rating: (i + 1).toString(),
        count,
      })),
      difficultyData: difficultyCounts.map((count, i) => ({
        difficulty: (i + 1).toString(),
        count,
      })),
      overallRating: avgRating,
      overallDifficulty: avgDifficulty,
    };
  }, [courseReviewData]);

  const { offerings, errorOfferings } = useCourseOfferings(course);

  const [showAllSectionsMap, setShowAllSectionsMap] = useState<
    Record<string, boolean>
  >({});
  const [showLabTutMap, setShowLabTutMap] = useState<Record<string, boolean>>(
    {}
  );

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
      <main className="container course-container">
        <div className="course-main-header">
          <BoneRegion name="course-header-card">
            <CourseHeaderCard
              course={course}
              totalReviews={courseReviewData?.total_reviews}
            />
          </BoneRegion>

          {courseReviewData && (
            <BoneRegion name="course-charts">
              <ReviewCharts
                ratingData={charts.ratingData}
                difficultyData={charts.difficultyData}
                totalReviews={courseReviewData.total_reviews}
                overallRating={charts.overallRating}
                overallDifficulty={charts.overallDifficulty}
              />
            </BoneRegion>
          )}
        </div>

        <div className="course-bottom-container">
          <BoneRegion name="course-reviews">
            <div className="course-bottom-left">
              <ReviewsAndPostsTabs
                context="course"
                reviewData={
                  courseReviewData ? { reviews: filteredReviews } : null
                }
                reviewLoading={false}
                reviewError={reviewError}
                displayedReviews={displayedReviews}
                onLoadMoreReviews={loadMoreReviews}
                getCourseCodesWithCounts={getInstructorsWithCounts}
                getFilterStats={getFilterStats}
                selectedCourseFilter={selectedInstructorFilter}
                onCourseFilterChange={onInstructorFilterChange}
                selectedSortOption={selectedSortOption}
                onSortOptionChange={onSortOptionChange}
              />
            </div>
          </BoneRegion>

          <div className="course-bottom-right">
            <BoneRegion name="course-prereqs">
              <CoursePrerequisites
                course={course}
                showVisualization={showPrereqVis}
                onToggleVisualization={() => setShowPrereqVis((v) => !v)}
              />
            </BoneRegion>

            <BoneRegion name="course-offerings">
              <div className="course-offerings">
                {errorOfferings ? (
                  `Error loading offerings: ${errorOfferings.message}`
                ) : offerings.length === 0 ? (
                  "No offerings available"
                ) : (
                  <CourseTabContainer tabs={tabs} />
                )}
              </div>
            </BoneRegion>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoursePage;
