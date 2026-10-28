import { useEffect, useState } from "react";
import Router from "next/router";
import type { SkeletonRoute } from "src/components/skeletons/RouteSkeleton";

type SkeletonModule = typeof import("src/components/skeletons/RouteSkeleton");

// Navigations that finish within this window (cached pages) never flash a
// skeleton.
const SHOW_DELAY_MS = 80;

let loading: Promise<SkeletonModule> | null = null;

/** Loads the skeleton components (a separate chunk, kept off every page). */
function loadSkeletons() {
  loading ??= import("src/components/skeletons/RouteSkeleton");
  return loading;
}

const pathOf = (url: string) => url.split(/[?#]/)[0];

export interface PendingSkeleton {
  route: SkeletonRoute;
  module: SkeletonModule;
}

/**
 * While an in-app navigation to a course, instructor or explore page waits
 * for its data, returns the skeleton to render in place of the old page, so
 * the click responds instantly.
 */
export function useRouteSkeleton() {
  const [pending, setPending] = useState<PendingSkeleton | null>(null);

  useEffect(() => {
    // Fetch the skeleton chunk once the page is idle so it's ready in time.
    const idle = setTimeout(loadSkeletons, 2000);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let navigatingTo: string | null = null;
    let isPopState = false;

    Router.beforePopState(() => {
      isPopState = true;
      return true;
    });

    const onStart = (url: string, { shallow }: { shallow: boolean }) => {
      clearTimeout(timer);
      navigatingTo = null;
      const fromHistory = isPopState;
      isPopState = false;
      // Back/forward keep the browser's scroll restoration undisturbed.
      if (shallow || fromHistory) return;
      if (pathOf(url) === pathOf(Router.asPath)) return;

      navigatingTo = url;
      timer = setTimeout(async () => {
        const mod = await loadSkeletons();
        const route = mod.skeletonRouteFor(url);
        // The navigation may have finished while the chunk loaded.
        if (!route || navigatingTo !== url) return;
        setPending({ route, module: mod });
        window.scrollTo(0, 0);
      }, SHOW_DELAY_MS);
    };

    const onDone = () => {
      clearTimeout(timer);
      navigatingTo = null;
      setPending(null);
    };

    Router.events.on("routeChangeStart", onStart);
    Router.events.on("routeChangeComplete", onDone);
    Router.events.on("routeChangeError", onDone);
    return () => {
      clearTimeout(idle);
      clearTimeout(timer);
      Router.events.off("routeChangeStart", onStart);
      Router.events.off("routeChangeComplete", onDone);
      Router.events.off("routeChangeError", onDone);
    };
  }, []);

  return pending;
}
