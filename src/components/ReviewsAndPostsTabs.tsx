import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { RotatingLines } from "react-loader-spinner";
import { BiSolidUpvote } from "react-icons/bi";
import { Review } from "../types";
import { formatShortDate } from "../utils/format";

interface RedditPostData {
  title: string;
  upvotes: number;
  date_created: Date;
  url: string;
}

type ContextType = "instructor" | "course";

interface ReviewsAndPostsTabsProps {
  context: ContextType;
  reviewData: {
    reviews: Review[];
  } | null;
  reviewLoading: boolean;
  reviewError: string | null;
  redditPosts: RedditPostData[];
  redditLoading: boolean;
  redditError: string | null;
  displayedReviews: Review[];
  displayedRedditPosts: RedditPostData[];
  onLoadMoreReviews: () => void;
  onLoadMoreRedditPosts: () => void;
  getCourseCodesWithCounts: () => Array<{ courseCode: string; count: number }>;
  getFilterStats: () => { avgRating: number; avgDifficulty: number };
  selectedCourseFilter: string;
  onCourseFilterChange: (value: string) => void;
  selectedSortOption: string;
  onSortOptionChange: (value: string) => void;
  getInstructorName?: (courseCode: string) => string; // Optional function to get instructor name for course code
  className?: string; // Optional className for styling
}

const ReviewsAndPostsTabs: React.FC<ReviewsAndPostsTabsProps> = ({
  context,
  reviewData,
  reviewLoading,
  reviewError,
  redditPosts,
  redditLoading,
  redditError,
  displayedReviews,
  displayedRedditPosts,
  onLoadMoreReviews,
  onLoadMoreRedditPosts,
  getCourseCodesWithCounts,
  getFilterStats,
  selectedCourseFilter,
  onCourseFilterChange,
  selectedSortOption,
  onSortOptionChange,
  getInstructorName,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<"reviews" | "reddit">("reviews");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === "reviews") {
            onLoadMoreReviews();
          } else {
            onLoadMoreRedditPosts();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [activeTab, onLoadMoreReviews, onLoadMoreRedditPosts]);

  return (
    <div className={`reviews-posts-tabs-section ${className || ""}`}>
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "reviews" ? "active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          RateMyProf Reviews
        </button>
        <button
          className={`tab-button ${activeTab === "reddit" ? "active" : ""}`}
          onClick={() => setActiveTab("reddit")}
        >
          r/simonfraser
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "reviews" ? (
          <div className="reviews-section">
            {reviewLoading ? (
              <div className="center loading-spinner-container">
                <RotatingLines visible={true} strokeColor="#24a98b" />
                <p>Loading reviews...</p>
              </div>
            ) : reviewError ? (
              <div className="center">
                <p className="text-muted">{reviewError}</p>
              </div>
            ) : reviewData ? (
              <div className="reviews-list">
                <div className="reviews-header">
                  <div className="filter-controls">
                    <div className="filter-dropdowns">
                      <div className="course-filter">
                        <select
                          value={selectedCourseFilter}
                          onChange={(e) => onCourseFilterChange(e.target.value)}
                          className="course-filter-dropdown"
                        >
                          <option value="all">
                            {context === "instructor"
                              ? "All Courses"
                              : "All Instructors"}
                          </option>
                          {getCourseCodesWithCounts().map(
                            ({ courseCode, count }) => (
                              <option key={courseCode} value={courseCode}>
                                {courseCode} ({count})
                              </option>
                            )
                          )}
                        </select>
                      </div>
                      <div className="review-sorter">
                        <select
                          value={selectedSortOption}
                          onChange={(e) => onSortOptionChange(e.target.value)}
                          className="review-sorter-dropdown"
                        >
                          <option value="most-recent">Most Recent</option>
                          <option value="least-recent">Least Recent</option>
                          <option value="hardest">Hardest</option>
                          <option value="easiest">Easiest</option>
                          <option value="most-liked">Most Liked</option>
                          <option value="most-disliked">Most Disliked</option>
                        </select>
                      </div>
                    </div>
                    <div className="filter-stats">
                      <div className="filter-stat-item">
                        <span className="filter-stat-label">Avg Rating:</span>
                        <span className="filter-stat-value">
                          {getFilterStats().avgRating.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="filter-stat-item">
                        <span className="filter-stat-label">
                          Avg Difficulty:
                        </span>
                        <span className="filter-stat-value">
                          {getFilterStats().avgDifficulty.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {displayedReviews.length > 0 ? (
                  displayedReviews.map((review, index) => (
                    <div key={index} className="review-card">
                      <div className="review-header">
                        <div className="review-rating">
                          <div className="course-instructor-info">
                            <span className="course-code">
                              {context === "course"
                                ? review.instructor_name ?? review.course_code
                                : review.course_code}
                            </span>
                          </div>
                          <div className="rating-line">
                            <span className="rating-value">
                              Rating: {+review.rating}/5
                            </span>
                            <span className="rating-value">
                              Difficulty: {+review.difficulty}/5
                            </span>
                          </div>
                        </div>
                        <div className="review-meta">
                          <div className="review-metadata">
                            <span className="metadata-item">
                              For Credit:{" "}
                              <strong>{review.metadata["For Credit"]}</strong>
                            </span>
                            <span className="metadata-item">
                              Attendance:{" "}
                              <strong>{review.metadata["Attendance"]}</strong>
                            </span>
                            {review.metadata["Would Take Again"] &&
                              review.metadata["Would Take Again"].trim() !==
                                "" && (
                                <span className="metadata-item">
                                  Would Take Again:{" "}
                                  <strong>
                                    {review.metadata["Would Take Again"]}
                                  </strong>
                                </span>
                              )}
                            {review.metadata["Grade"] &&
                              review.metadata["Grade"].trim() !== "" && (
                                <span className="metadata-item">
                                  Grade:{" "}
                                  <strong>{review.metadata["Grade"]}</strong>
                                </span>
                              )}
                            {review.metadata["Textbook"] &&
                              review.metadata["Textbook"].trim() !== "" && (
                                <span className="metadata-item">
                                  Textbook:{" "}
                                  <strong>{review.metadata["Textbook"]}</strong>
                                </span>
                              )}
                            {review.metadata["Online Class"] &&
                              review.metadata["Online Class"].trim() !== "" && (
                                <span className="metadata-item">
                                  Online Class:{" "}
                                  <strong>
                                    {review.metadata["Online Class"]}
                                  </strong>
                                </span>
                              )}
                          </div>
                          <span className="review-date">{review.date}</span>
                        </div>
                      </div>
                      <div className="review-content">
                        <p>{review.review_msg}</p>
                      </div>

                      {review.tags && review.tags.length > 0 && (
                        <div className="review-tags">
                          {review.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="review-footer">
                        <span className="helpful-count">
                          {review.helpful} helpful, {review.not_helpful} not
                          helpful
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-reviews-message">
                    <p>No reviews available for this instructor yet.</p>
                  </div>
                )}
                <div ref={loadMoreRef} className="load-more-trigger" />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="reddit-posts-section">
            {redditLoading ? (
              <div className="center loading-spinner-container">
                <RotatingLines visible={true} strokeColor="#24a98b" />
                <p>Loading Reddit posts...</p>
              </div>
            ) : redditError ? (
              <div className="center">
                <p className="text-muted">{redditError}</p>
              </div>
            ) : displayedRedditPosts.length > 0 ? (
              <div className="reddit-posts">
                {displayedRedditPosts.map((post, index) => (
                  <Link
                    key={index}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reddit-post-link"
                  >
                    <div className="reddit-post">
                      <div className="upvote-container">
                        <BiSolidUpvote style={{ fill: "#ff4500" }} />
                        <p>{post.upvotes}</p>
                      </div>
                      <div>
                        <h4>{post.title}</h4>
                        <p>{formatShortDate(post.date_created, true)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                <div ref={loadMoreRef} className="load-more-trigger" />
              </div>
            ) : (
              <div className="no-reddit-message">
                <p>No Reddit posts found for this instructor.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsAndPostsTabs;
