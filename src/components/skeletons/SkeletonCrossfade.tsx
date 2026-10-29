import React, { useEffect, useRef, useState } from "react";

/**
 * How long the skeleton takes to dissolve into the real content. Keep in sync
 * with `--skeleton-fade-duration` in src/styles/components/bones.scss.
 */
export const SKELETON_FADE_MS = 240;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Shows `skeleton` while `loading`, then cross-fades to `children`.
 *
 * Because our skeletons are captured from the real UI, the skeleton and the
 * content share the same geometry. So rather than hard-swapping (which reads
 * as a jump), the real content renders immediately underneath and the
 * skeleton stays on top for a moment, fading out. Card surfaces are identical
 * in both layers, so they stay put while the bones dissolve into text.
 *
 * The overlay is clipped to the content's box, so a skeleton taller than the
 * loaded page never affects layout. With `prefers-reduced-motion`, the swap is
 * instant (see bones.scss).
 */
export const SkeletonCrossfade: React.FC<{
  loading: boolean;
  skeleton: React.ReactNode;
  children?: React.ReactNode;
}> = ({ loading, skeleton, children }) => {
  // The last skeleton shown, kept so it can fade out after `skeleton` itself
  // is gone (e.g. once the route skeleton is cleared).
  const lastSkeleton = useRef<React.ReactNode>(skeleton);
  if (loading) lastSkeleton.current = skeleton;

  // Start the fade in the same render that swaps in the content, so there's
  // never a frame with neither on screen.
  const [wasLoading, setWasLoading] = useState(loading);
  const [fading, setFading] = useState(false);
  if (wasLoading !== loading) {
    setWasLoading(loading);
    setFading(wasLoading && !loading && !prefersReducedMotion());
  }

  useEffect(() => {
    if (!fading) return;
    // Backstop for when animationend never fires (e.g. a background tab).
    const timer = setTimeout(() => setFading(false), SKELETON_FADE_MS + 200);
    return () => clearTimeout(timer);
  }, [fading]);

  return (
    <div className="skeleton-crossfade">
      {loading ? skeleton : children}
      {fading && !loading && (
        <div
          className="skeleton-crossfade__out"
          aria-hidden="true"
          // Not focusable or clickable while it fades.
          {...({ inert: "" } as object)}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) setFading(false);
          }}
        >
          {lastSkeleton.current}
        </div>
      )}
    </div>
  );
};

/**
 * True for a moment after `loading` turns false, so a region that swapped a
 * skeleton for content can fade that content in (`content-reveal` class).
 * Content that was there from the start, or that changes later (filtering,
 * paging), isn't animated.
 */
export function useRevealAfterLoading(loading: boolean) {
  const [wasLoading, setWasLoading] = useState(loading);
  const [revealing, setRevealing] = useState(false);
  if (wasLoading !== loading) {
    setWasLoading(loading);
    setRevealing(wasLoading && !loading);
  }
  useEffect(() => {
    if (!revealing) return;
    const timer = setTimeout(() => setRevealing(false), SKELETON_FADE_MS + 200);
    return () => clearTimeout(timer);
  }, [revealing]);
  return revealing;
}

export default SkeletonCrossfade;
