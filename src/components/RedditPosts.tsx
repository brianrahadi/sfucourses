import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

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
      <h3>Related Reddit Posts</h3>
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
              <h4>{post.title}</h4>
              <p>Upvotes: {post.upvotes}</p>
              <p>Posted on: {post.date_created.toDateString()}</p>
            </div>
          </Link>
        ))
      ) : (
        <p>No Reddit posts found for this course.</p>
      )}
    </div>
  );
};
