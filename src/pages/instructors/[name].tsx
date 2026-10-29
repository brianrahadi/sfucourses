import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import { InstructorOffering } from "@types";
import { Helmet, ReviewsAndPostsTabs } from "@components";
import Link from "next/link";
import { termToIcon } from "@utils/exploreFilters";
import { ReviewCharts } from "@components";
import { INSTRUCTOR_REDIRECT_NAME_MAPPING } from "@const";
import { BoneRegion } from "src/components/bones/BoneShell";
import dynamic from "next/dynamic";
import { SkeletonCrossfade } from "src/components/skeletons/SkeletonCrossfade";

// Only fallback renders need the skeleton, so it's a separate chunk that
// fully generated pages never download.
const InstructorPageSkeleton = dynamic(
  () => import("src/components/skeletons/InstructorPageSkeleton")
);
import {
  InstructorPageProps,
  loadInstructorPage,
  PAGE_REVALIDATE_SECONDS,
  popularInstructorNames,
  prerenderLimit,
} from "src/lib/pageData";
import {
  reviewAverages,
  reviewDistributions,
  sortReviews,
} from "@utils/reviewSort";

const REVIEWS_PER_PAGE = 5;

const instructorPath = (name: string) =>
  `/instructors/${encodeURIComponent(name)}`;

// Instructor pages are generated on first visit and then served from the
// CDN, refreshed in the background at most hourly. The most-reviewed
// instructors are generated at build time.
export const getStaticPaths: GetStaticPaths = async () => {
  const limit = prerenderLimit(process.env.PRERENDER_INSTRUCTOR_PAGES, 50);
  let names: string[] = [];
  try {
    names = await popularInstructorNames(limit);
  } catch (err) {
    console.error("Could not list popular instructors to prerender:", err);
  }
  return {
    paths: names.map((name) => ({ params: { name } })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<InstructorPageProps> = async ({
  params,
}) => {
  const name = params?.name;
  if (typeof name !== "string" || !name.trim()) {
    return { notFound: true, revalidate: PAGE_REVALIDATE_SECONDS };
  }

  const redirectName = INSTRUCTOR_REDIRECT_NAME_MAPPING[name];
  if (redirectName) {
    return {
      redirect: { destination: instructorPath(redirectName), permanent: false },
      revalidate: PAGE_REVALIDATE_SECONDS,
    };
  }

  const result = await loadInstructorPage(name);
  if (result.kind === "notFound") {
    return { notFound: true, revalidate: PAGE_REVALIDATE_SECONDS };
  }
  if (result.kind === "redirect") {
    return {
      redirect: { destination: instructorPath(result.name), permanent: false },
      revalidate: PAGE_REVALIDATE_SECONDS,
    };
  }
  return { props: result.props, revalidate: PAGE_REVALIDATE_SECONDS };
};

const InstructorPage: React.FC<Partial<InstructorPageProps>> = ({
  instructor,
  reviews,
}) => {
  const router = useRouter();

  // First visit to an instructor that hasn't been generated yet: skeleton,
  // then cross-fade to the page once it's generated.
  const loading = router.isFallback || !instructor;

  return (
    <>
      {loading && <Helmet pageTitle="instructor details" />}
      <SkeletonCrossfade
        loading={loading}
        skeleton={<InstructorPageSkeleton />}
      >
        {instructor && (
          <InstructorView instructor={instructor} reviews={reviews ?? null} />
        )}
      </SkeletonCrossfade>
    </>
  );
};

const InstructorView: React.FC<InstructorPageProps> = ({
  instructor,
  reviews: reviewData,
}) => {
  const [selectedCourseFilter, setSelectedCourseFilter] =
    useState<string>("all");
  const [selectedSortOption, setSelectedSortOption] = useState("most-recent");
  const [visibleReviews, setVisibleReviews] = useState(REVIEWS_PER_PAGE);

  const reviewError = reviewData ? null : "Review data not available";

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

  const filteredReviews = useMemo(() => {
    const all = reviewData?.reviews ?? [];
    const reviews =
      selectedCourseFilter === "all"
        ? all
        : all.filter((review) => review.course_code === selectedCourseFilter);
    return sortReviews(reviews, selectedSortOption);
  }, [reviewData?.reviews, selectedCourseFilter, selectedSortOption]);

  const displayedReviews = useMemo(
    () => filteredReviews.slice(0, visibleReviews),
    [filteredReviews, visibleReviews]
  );

  const loadMoreReviews = useCallback(() => {
    setVisibleReviews((count) =>
      count < filteredReviews.length ? count + REVIEWS_PER_PAGE : count
    );
  }, [filteredReviews.length]);

  const onCourseFilterChange = (value: string) => {
    setSelectedCourseFilter(value);
    setVisibleReviews(REVIEWS_PER_PAGE);
  };
  const onSortOptionChange = (value: string) => {
    setSelectedSortOption(value);
    setVisibleReviews(REVIEWS_PER_PAGE);
  };

  const getFilterStats = useCallback(
    () => reviewAverages(filteredReviews),
    [filteredReviews]
  );

  const chartData = useMemo(() => {
    const { ratingCounts, difficultyCounts } = reviewDistributions(
      reviewData?.reviews ?? []
    );
    return {
      ratingData: ratingCounts.map((count, index) => ({
        rating: index + 1,
        count,
      })),
      difficultyData: difficultyCounts.map((count, index) => ({
        difficulty: index + 1,
        count,
      })),
    };
  }, [reviewData?.reviews]);

  const offeringsByTerm = useMemo(
    () =>
      Object.entries(
        (instructor.offerings ?? []).reduce((acc, offering) => {
          if (!acc[offering.term]) acc[offering.term] = [];
          acc[offering.term].push(offering);
          return acc;
        }, {} as Record<string, InstructorOffering[]>)
      ),
    [instructor.offerings]
  );

  return (
    <div className="page courses-page">
      <Helmet pageTitle={`${instructor.name} @ sfucourses`} />
      <main className="container course-container">
        <div className="course-main-header">
          <BoneRegion name="instructor-header-card">
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
          </BoneRegion>

          {reviewData && (
            <BoneRegion name="instructor-charts">
              <ReviewCharts
                ratingData={chartData.ratingData}
                difficultyData={chartData.difficultyData}
                totalReviews={parseInt(reviewData.total_ratings || "0", 10)}
                overallRating={parseFloat(reviewData.overall_rating || "0")}
                overallDifficulty={parseFloat(
                  reviewData.difficulty_level || "0"
                )}
              />
            </BoneRegion>
          )}
        </div>

        <div className="course-bottom-container">
          <BoneRegion name="instructor-reviews">
            <div className="course-bottom-left">
              <ReviewsAndPostsTabs
                context="instructor"
                reviewData={reviewData ? { reviews: filteredReviews } : null}
                reviewLoading={false}
                reviewError={reviewError}
                displayedReviews={displayedReviews}
                onLoadMoreReviews={loadMoreReviews}
                getCourseCodesWithCounts={getCourseCodesWithCounts}
                getFilterStats={getFilterStats}
                selectedCourseFilter={selectedCourseFilter}
                onCourseFilterChange={onCourseFilterChange}
                selectedSortOption={selectedSortOption}
                onSortOptionChange={onSortOptionChange}
              />
            </div>
          </BoneRegion>

          <BoneRegion name="instructor-offerings">
            <div className="course-bottom-right">
              <div className="instructor-offerings-list">
                {offeringsByTerm.length > 0 ? (
                  offeringsByTerm.map(([term, offerings]) => (
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
                              prefetch={false}
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
          </BoneRegion>
        </div>
      </main>
    </div>
  );
};

export default InstructorPage;
