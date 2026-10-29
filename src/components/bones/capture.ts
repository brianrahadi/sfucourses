/**
 * Bone extractor used by `npm run bones` (the boneyard-js CLI).
 *
 * The CLI loads each page with `window.__BONEYARD_BUILD = true`, then calls
 * `window.__BONEYARD_SNAPSHOT(el)` on every `[data-boneyard]` region. This is
 * boneyard's snapshotBones() walk, with one change: text is captured line by
 * line (via Range#getClientRects) instead of as one block per paragraph, so
 * the skeleton has the real number of lines at their real widths.
 *
 * Only loaded during capture; never part of the production bundle.
 */

type CapturedBone = {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number | string;
  c?: boolean;
};

const LEAF_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "td",
  "th",
  "a",
  "span",
  "b",
  "strong",
  "label",
]);
const MEDIA_TAGS = new Set(["img", "svg", "video", "canvas", "iframe"]);
const FORM_TAGS = new Set(["input", "button", "textarea", "select"]);

// Text bars are drawn over the middle of each line box, like x-height.
const TEXT_BAR_INSET = 0.22;

function isHidden(style: CSSStyleDeclaration) {
  return (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  );
}

function radiusOf(style: CSSStyleDeclaration): number | string {
  const r = style.borderTopLeftRadius;
  if (r.endsWith("%")) return r;
  return Math.round(parseFloat(r) || 0);
}

/** One rect per rendered line of text in `node`, merged across inline boxes. */
function lineRects(node: Element): DOMRect[] {
  const range = document.createRange();
  range.selectNodeContents(node);
  const rects = Array.from(range.getClientRects()).filter(
    (r) => r.width >= 2 && r.height >= 2
  );
  const lines: { top: number; bottom: number; left: number; right: number }[] =
    [];
  for (const r of rects) {
    const mid = (r.top + r.bottom) / 2;
    const line = lines.find((l) => mid >= l.top && mid <= l.bottom);
    if (line) {
      line.left = Math.min(line.left, r.left);
      line.right = Math.max(line.right, r.right);
      line.top = Math.min(line.top, r.top);
      line.bottom = Math.max(line.bottom, r.bottom);
    } else {
      lines.push({
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
      });
    }
  }
  return lines.map(
    (l) => new DOMRect(l.left, l.top, l.right - l.left, l.bottom - l.top)
  );
}

export function snapshotBones(el: Element, name = "component") {
  const root = el.getBoundingClientRect();
  const bones: CapturedBone[] = [];

  const push = (rect: DOMRect, r: number | string, c?: boolean) => {
    if (rect.width < 1 || rect.height < 1) return;
    const bone: CapturedBone = {
      x: +(((rect.left - root.left) / root.width) * 100).toFixed(3),
      y: Math.round(rect.top - root.top),
      w: +((rect.width / root.width) * 100).toFixed(3),
      h: Math.round(rect.height),
      r,
    };
    if (c) bone.c = true;
    bones.push(bone);
  };

  const walk = (node: Element) => {
    const style = getComputedStyle(node);
    if (isHidden(style)) return;
    if (node.closest("[data-bones-ignore]")) return;

    // Data-shaped regions (chart plots, score bars) are drawn as one block so
    // the skeleton doesn't imply the template page's numbers.
    if (node.hasAttribute("data-bones-block")) {
      push(node.getBoundingClientRect(), radiusOf(style) || 4);
      return;
    }

    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.children).filter(
      (child) => !isHidden(getComputedStyle(child))
    );
    const isMedia = MEDIA_TAGS.has(tag);
    const isForm = FORM_TAGS.has(tag);
    const onlyInlineChildren = children.every((child) => {
      const d = getComputedStyle(child).display;
      return d === "inline" || d === "contents";
    });
    const isLeaf =
      children.length === 0 ||
      isMedia ||
      isForm ||
      (LEAF_TAGS.has(tag) && onlyInlineChildren) ||
      (onlyInlineChildren && (node.textContent ?? "").trim().length > 0);

    const bg = style.backgroundColor;
    const hasBg =
      (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") ||
      style.backgroundImage !== "none";
    const borderWidth = parseFloat(style.borderTopWidth) || 0;
    const hasBorder =
      borderWidth > 0 &&
      style.borderTopColor !== "rgba(0, 0, 0, 0)" &&
      style.borderTopColor !== "transparent";
    const radius = radiusOf(style);
    const hasSurface = hasBg || (hasBorder && radius !== 0);

    if (isLeaf) {
      const rect = node.getBoundingClientRect();
      const text = (node.textContent ?? "").trim();
      if (isMedia || isForm || !text) {
        // Surfaces (buttons, selects, badges) keep their shape as a container.
        if (isForm && hasSurface) push(rect, radius || 8, true);
        else if (isMedia || hasSurface) {
          const square = isMedia && Math.abs(rect.width - rect.height) < 4;
          push(rect, square ? "50%" : radius || 4);
        }
        if (isForm && text) {
          for (const line of lineRects(node)) {
            const inset = line.height * TEXT_BAR_INSET;
            push(
              new DOMRect(
                line.left,
                line.top + inset,
                line.width,
                line.height - inset * 2
              ),
              4
            );
          }
        }
        return;
      }
      if (hasSurface) push(rect, radius, true);
      for (const line of lineRects(node)) {
        const inset = line.height * TEXT_BAR_INSET;
        push(
          new DOMRect(
            line.left,
            line.top + inset,
            line.width,
            line.height - inset * 2
          ),
          4
        );
      }
      return;
    }

    if (hasSurface) push(node.getBoundingClientRect(), radius, true);
    for (const child of children) walk(child);
  };

  for (const child of Array.from(el.children)) walk(child);

  return {
    name,
    viewportWidth: window.innerWidth,
    width: Math.round(root.width),
    height: Math.round(root.height),
    bones,
  };
}

export function install() {
  (window as any).__BONEYARD_SNAPSHOT = snapshotBones;
}
