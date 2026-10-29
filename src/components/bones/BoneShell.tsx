import React from "react";

/**
 * Pixel-accurate skeletons, captured from the real UI with `npm run bones`
 * (boneyard-js). A <BoneShell> renders the same element and class as the
 * region it stands in for, so the page's own CSS puts it in exactly the same
 * place at the same size, and draws that region's captured bones inside.
 *
 * Unlike boneyard's runtime <Skeleton>, it needs no JavaScript to measure the
 * page: every captured width is rendered on the server and CSS media queries
 * show the right one, so the skeleton is correct on the very first paint.
 */

/**
 * Viewport ranges and the width each one is captured at. Keep in sync with
 * boneyard.config.json and src/styles/components/bones.scss.
 */
export const BONE_RANGES = [
  { min: 0, capture: 390 },
  { min: 601, capture: 680 },
  { min: 769, capture: 840 },
  { min: 901, capture: 960 },
  { min: 1025, capture: 1140 },
  { min: 1280, capture: 1440 },
] as const;

type CompactBone = (number | string | boolean)[];
interface BoneCaptureData {
  width: number;
  height: number;
  bones: CompactBone[];
}
export interface BoneFile {
  breakpoints: Record<string, BoneCaptureData | undefined>;
}

function captureForRange(file: BoneFile, capture: number) {
  const widths = Object.keys(file.breakpoints).map(Number);
  if (widths.length === 0) return null;
  const nearest = widths.reduce((best, w) =>
    Math.abs(w - capture) < Math.abs(best - capture) ? w : best
  );
  return file.breakpoints[String(nearest)];
}

const Bone = ({
  bone,
  rootHeight,
}: {
  bone: CompactBone;
  rootHeight: number;
}) => {
  const [x, y, w, h, r, c] = bone as [
    number,
    number,
    number,
    number,
    number | string,
    boolean?
  ];
  // The region's own surface is drawn by its CSS; skip a container bone that
  // just duplicates it.
  if (c && x <= 0.5 && y <= 1 && w >= 99.5 && h >= rootHeight - 2) return null;
  return (
    <span
      className={c ? "bone bone--surface" : "bone"}
      style={{
        left: `${x}%`,
        top: y,
        width: `${w}%`,
        height: h,
        borderRadius: r,
      }}
    />
  );
};

type ShellTag = "div" | "main" | "section" | "aside" | "article";

interface BoneShellProps {
  /** Captured bones, imported from src/bones/<name>.bones.json. */
  bones: BoneFile;
  name: string;
  as?: ShellTag;
  className?: string;
  style?: React.CSSProperties;
  /**
   * For regions sized by their content (not their container), like the
   * explore filter column: take the captured width, which an empty shell
   * otherwise wouldn't have.
   */
  contentWidth?: boolean;
}

export const BoneShell: React.FC<BoneShellProps> = ({
  bones: file,
  name,
  as: Tag = "div",
  className,
  style,
  contentWidth = false,
}) => {
  const captures = BONE_RANGES.map((range) =>
    captureForRange(file, range.capture)
  );

  const heights: Record<string, string> = {};
  captures.forEach((capture, i) => {
    heights[`--bone-h-${i}`] = `${capture?.height ?? 120}px`;
    if (contentWidth && capture)
      heights[`--bone-w-${i}`] = `${capture.width}px`;
  });

  return (
    <Tag
      className={`${className ?? ""} bone-shell${
        contentWidth ? " bone-shell--content-width" : ""
      }`}
      style={{ ...heights, ...style } as React.CSSProperties}
      aria-busy="true"
      aria-label="Loading"
      data-bone-shell={name}
    >
      {captures.map((capture, i) => {
        if (!capture) return null;
        return (
          <span
            key={i}
            className={`bone-set bone-set--${i}`}
            aria-hidden="true"
          >
            {capture.bones.map((bone, j) => (
              <Bone key={j} bone={bone} rootHeight={capture.height} />
            ))}
          </span>
        );
      })}
    </Tag>
  );
};

/**
 * Marks a rendered region for capture by `npm run bones`. It renders no box
 * of its own (display: contents), so it doesn't affect layout.
 */
export const BoneRegion: React.FC<{
  name: string;
  children: React.ReactElement;
}> = ({ name, children }) => (
  <div data-boneyard={name} style={{ display: "contents" }}>
    {children}
  </div>
);

export default BoneShell;
