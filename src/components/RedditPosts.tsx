import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BiSolidUpvote } from "react-icons/bi";
import { formatShortDate } from "@utils/format";
import { RotatingLines } from "react-loader-spinner";

interface RedditPostData {
  title: string;
  upvotes: number;
  date_created: Date;
  url: string;
}

interface RedditPostsProps {
  query: string;
}

const fetchRedditPosts = async (query: string) => {
  const response = await fetch(
    `/api/reddit?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Reddit posts: ${response.status}`);
  }

  return await response.json();
};

export const RedditPosts: React.FC<RedditPostsProps> = ({ query }) => {
  const {
    data: redditResults,
    isLoading,
    error,
  } = useQuery<RedditPostData[], Error>({
    queryKey: ["redditPosts", query],
    queryFn: () => fetchRedditPosts(query),
  });

  return (
    <div className="reddit-posts-container">
      <h2>r/simonfraser posts</h2>
      <div className="reddit-posts">
        {isLoading ? (
          <div className="loading-spinner-container">
            <RotatingLines visible={true} strokeColor="#24a98b" />
          </div>
        ) : error ? (
          <div className="error">Error: {error.message}</div>
        ) : redditResults && redditResults.length > 0 ? (
          redditResults.map((post, index) => (
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
          ))
        ) : (
          <p>No Reddit posts found for this course</p>
        )}
      </div>
    </div>
  );
};
