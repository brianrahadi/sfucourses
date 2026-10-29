import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface SearchIndex {
  courses: { dept: string; number: string; title: string }[];
  instructors: { name: string }[];
}

const SEARCH_INDEX_KEY = ["searchIndex"];

async function fetchSearchIndex(): Promise<SearchIndex> {
  const response = await fetch("/api/search-index");
  if (!response.ok) {
    throw new Error(`Search index HTTP ${response.status}`);
  }
  return response.json();
}

const searchIndexQuery = {
  queryKey: SEARCH_INDEX_KEY,
  queryFn: fetchSearchIndex,
  staleTime: 60 * 60 * 1000,
  gcTime: 24 * 60 * 60 * 1000,
  retry: 2,
  refetchOnWindowFocus: false,
};

/**
 * The course/instructor search index, fetched lazily so it never competes
 * with a page's own data: it loads once the browser is idle after the page
 * has loaded, or immediately when `active` (the user is about to search).
 */
export function useSearchIndex(active: boolean) {
  const queryClient = useQueryClient();
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const start = () => setIdle(true);
    const w = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (cb: () => void, opts?: object) => number;
        cancelIdleCallback?: (id: number) => void;
      };
    let idleId: number | undefined;
    const timer = setTimeout(() => {
      if (w.requestIdleCallback) {
        idleId = w.requestIdleCallback(start, { timeout: 4000 });
      } else {
        start();
      }
    }, 2500);
    return () => {
      clearTimeout(timer);
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
    };
  }, []);

  const query = useQuery({ ...searchIndexQuery, enabled: active || idle });

  return {
    courses: query.data?.courses,
    instructors: query.data?.instructors,
    isLoading: query.isLoading && query.fetchStatus !== "idle",
    prefetch: () => queryClient.prefetchQuery(searchIndexQuery),
  };
}
