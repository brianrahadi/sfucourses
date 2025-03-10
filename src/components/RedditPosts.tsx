import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BiSolidUpvote } from "react-icons/bi";
import { formatShortDate } from "@utils/format";

interface RedditPostData {
  title: string;
  upvotes: number;
  date_created: Date;
  url: string;
}

interface RedditPostsProps {
  dept: string;
  number: string;
}

const fetchRedditPosts = async (dept: string, number: string) => {
  const response = await fetch(
    `https://www.reddit.com/r/simonfraser/search.json?q=${dept}%20${number}&restrict_sr=on`
  );
  const data = await response.json();
  return data.data.children.map((post: any) => ({
    title: post.data.title,
    upvotes: post.data.ups,
    date_created: new Date(post.data.created_utc * 1000),
    url: `https://www.reddit.com${post.data.permalink}`,
  }));
};

export const RedditPosts: React.FC<RedditPostsProps> = ({ dept, number }) => {
  const {
    data: redditResults,
    isLoading,
    error,
  } = useQuery<RedditPostData[], Error>({
    queryKey: ["redditPosts", dept, number],
    queryFn: () => fetchRedditPosts(dept, number),
  });

  if (isLoading) {
    return <div className="loading">Loading Reddit posts...</div>;
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  return (
    <div className="reddit-posts-container">
      <h2>r/simonfraser posts</h2>
      <div className="reddit-posts">
        {redditResults && redditResults.length > 0 ? (
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
