import { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import fs from "fs";
import path from "path";
import { useRouter } from "next/router";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useTheme } from "next-themes";
import { SidebarCourse, ExploreFilter, DraggablePanel } from "@components";
import { useExploreStore } from "src/store/useExploreStore";
import { CourseOutline } from "@types";
import { fetchFromApi } from "src/lib/api-wrapper";
import { PrereqGraphEntry, groupsOf, isPrereqGraph } from "@utils/prereqs";
import { MdFilterList } from "react-icons/md";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphNode {
  id: string;
  title: string;
  group: string;
  size: number;
  depth: number;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  /** prerequisite: required; alternative: one of several; corequisite: same term */
  type?: "prerequisite" | "alternative" | "corequisite";
  label?: string;
}

interface GraphPageProps {
  nodes: GraphNode[];
  links: GraphLink[];
}

const PREREQ_GRAPH_URL =
  "https://api.sfucourses.com/v1/rest/prerequisites/graph";
// Long enough for a cold API start, short enough that a hung request falls
// back to the snapshot well inside staticPageGenerationTimeout.
const PREREQ_GRAPH_TIMEOUT_MS = 20_000;

/**
 * Prerequisite data comes from the API (parsed from SFU's catalog and refreshed
 * weekly; the API triggers revalidate-graph after each refresh). The bundled
 * snapshot is used if the API is unreachable, slow, or returns malformed data.
 */
async function loadPrereqGraph(): Promise<PrereqGraphEntry[]> {
  try {
    const data = await fetchFromApi(PREREQ_GRAPH_URL, {
      timeoutMs: PREREQ_GRAPH_TIMEOUT_MS,
    });
    if (isPrereqGraph(data)) return data;
    throw new Error("malformed or empty prerequisite graph");
  } catch (err) {
    console.error("Falling back to bundled prerequisite snapshot:", err);
    const coursesPath = path.join(process.cwd(), "public/courses/courses.json");
    return JSON.parse(fs.readFileSync(coursesPath, "utf-8"));
  }
}

export const getStaticProps: GetStaticProps<GraphPageProps> = async () => {
  const courses = await loadPrereqGraph();

  const nodesMap = new Map<string, GraphNode>();
  const rawLinks: GraphLink[] = [];

  courses.forEach((c: any) => {
    const id = `${c.dept} ${c.number}`;
    if (!nodesMap.has(id)) {
      nodesMap.set(id, {
        id,
        title: id,
        group: c.dept,
        size: 5,
        depth: 1,
      });
    }

    // Each group must be met with one of its courses: a single-course group is
    // a hard requirement, a larger one is a set of alternatives.
    groupsOf(c).forEach((group) => {
      group.forEach((prereq) => {
        const alternative = group.length > 1;
        rawLinks.push({
          source: prereq,
          target: id,
          value: 1,
          type: alternative ? "alternative" : "prerequisite",
          label: alternative
            ? `${id} needs one of: ${group.join(", ")}`
            : `${id} requires ${prereq}`,
        });
        ensureNode(prereq);
      });
    });

    c.corequisites?.forEach((coreq: string) => {
      rawLinks.push({
        source: id,
        target: coreq,
        value: 1,
        type: "corequisite",
        label: `${id} and ${coreq}: corequisites`,
      });
      rawLinks.push({
        source: coreq,
        target: id,
        value: 1,
        type: "corequisite",
        label: `${id} and ${coreq}: corequisites`,
      });
      ensureNode(coreq);
    });
  });

  function ensureNode(code: string) {
    if (!nodesMap.has(code)) {
      nodesMap.set(code, {
        id: code,
        title: code,
        group: code.split(" ")[0] || "UNKNOWN",
        size: 5,
        depth: 1,
      });
    }
  }

  const uniqueLinksMap = new Map<string, GraphLink>();
  rawLinks.forEach((l) => {
    const kind = l.type === "corequisite" ? "co" : "pre";
    const key = `${l.source}-${l.target}-${kind}`;
    const existing = uniqueLinksMap.get(key);
    // a course listed both as required and as an alternative is required
    if (
      !existing ||
      (existing.type === "alternative" && l.type === "prerequisite")
    ) {
      uniqueLinksMap.set(key, l);
    }
  });

  return {
    props: {
      nodes: Array.from(nodesMap.values()),
      links: Array.from(uniqueLinksMap.values()),
    },
    revalidate: 60 * 60 * 24, // daily
  };
};

// Dark mode: soft pastels that pop on a dark background
const darkModeColors = [
  "#FFB3BA",
  "#FFDFBA",
  "#FFFFBA",
  "#B8FFCA",
  "#BAE1FF",
  "#D5BAFF",
  "#FFB3FF",
  "#FFC8A2",
  "#E2F0CB",
  "#B5EAD7",
  "#C7CEEA",
  "#FF9CEE",
  "#FFCBF2",
  "#F6A6FF",
  "#B19CD9",
  "#A8E6CF",
  "#DCEDC1",
  "#FFD3B6",
  "#FFAAA5",
  "#FF8B94",
];

// Light mode: richer, more saturated colors with good contrast on beige/white
const lightModeColors = [
  "#D94452",
  "#D97B2A",
  "#B89E1C",
  "#2D9E5A",
  "#2E7DB5",
  "#7C4DCC",
  "#C94AC9",
  "#D46A30",
  "#6B8F2E",
  "#2E9B82",
  "#5A6BBD",
  "#C44BA3",
  "#D45F8A",
  "#A24DD4",
  "#6F50B8",
  "#38A87A",
  "#7DA32E",
  "#D4723E",
  "#CF4545",
  "#E04E5E",
];

const GraphPage: React.FC<GraphPageProps> = ({ nodes, links }) => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isLightMode = resolvedTheme === "light";
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const courseSubjects = useExploreStore((state) => state.courseSubjects);
  const setCourseSubjects = useExploreStore((state) => state.setCourseSubjects);

  const courseLevels = useExploreStore((state) => state.courseLevels);
  const setCourseLevels = useExploreStore((state) => state.setCourseLevels);

  const fgRef = useRef<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const isHydratedRef = useRef(false);

  // Sync state from query on initial load
  useEffect(() => {
    if (router.isReady && !isHydratedRef.current) {
      const { subjects, levels } = router.query;
      if (subjects) {
        setCourseSubjects((subjects as string).split(","));
      }
      if (levels) {
        setCourseLevels((levels as string).split(","));
      }
      isHydratedRef.current = true;
    }
  }, [router.isReady, router.query, setCourseSubjects, setCourseLevels]);

  // Sync state to query when state changes
  useEffect(() => {
    if (!router.isReady || !isHydratedRef.current) return;

    const query = { ...router.query };

    if (courseSubjects.length > 0) {
      query.subjects = courseSubjects.join(",");
    } else {
      delete query.subjects;
    }

    if (courseLevels.length > 0) {
      query.levels = courseLevels.join(",");
    } else {
      delete query.levels;
    }

    const currentSubjects = router.query.subjects as string | undefined;
    const currentLevels = router.query.levels as string | undefined;

    const newSubjects = query.subjects as string | undefined;
    const newLevels = query.levels as string | undefined;

    if (currentSubjects !== newSubjects || currentLevels !== newLevels) {
      router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    }
  }, [
    courseSubjects,
    courseLevels,
    router,
    router.isReady,
    router.query,
    router.pathname,
  ]);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsFilterOpen(false);
    }
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNodeId(node.id);
  }, []);

  const closeSidebar = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedCourseOutline = useMemo(() => {
    if (!selectedNodeId) return null;
    const parts = selectedNodeId.split(" ");
    if (parts.length < 2) return null;
    const dept = parts[0].toLowerCase();
    const number = parts.slice(1).join(" ");

    return {
      dept,
      number,
    } as unknown as CourseOutline;
  }, [selectedNodeId]);

  // Group colors map
  const groupColors = useMemo(() => {
    const palette = isLightMode ? lightModeColors : darkModeColors;
    const groups = Array.from(new Set(nodes.map((n) => n.group)));
    const colorMap = new Map<string, string>();
    groups.forEach((group, i) => {
      colorMap.set(group, palette[i % palette.length]);
    });
    return colorMap;
  }, [nodes, isLightMode]);

  const graphData = useMemo(() => {
    if (courseSubjects.length === 0 && courseLevels.length === 0) {
      return { nodes: nodes, links: links };
    }

    const filteredNodes = nodes.filter((n) => {
      const idLower = n.id.toLowerCase();
      const parts = idLower.split(" ");
      const subject = parts[0];
      const number = parts[1] || "";

      let matchesSubject = true;
      if (courseSubjects.length > 0) {
        matchesSubject = courseSubjects
          .map((s) => s.toLowerCase())
          .includes(subject);
      }

      let matchesLevel = true;
      if (courseLevels.length > 0 && number) {
        const match = number.match(/^(\d)/);
        if (match) {
          const courseDigit = +match[1];
          matchesLevel = courseLevels.some((level) => {
            const levelDigit = +level[0];
            if (levelDigit >= 5) {
              return courseDigit >= 5;
            }
            return courseDigit === levelDigit;
          });
        } else {
          matchesLevel = false;
        }
      }

      return matchesSubject && matchesLevel;
    });

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

    const filteredLinks = links.filter((l) => {
      const sourceId =
        typeof l.source === "object" ? (l.source as any).id : l.source;
      const targetId =
        typeof l.target === "object" ? (l.target as any).id : l.target;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, courseSubjects, courseLevels]);

  const hasFilters = courseSubjects.length > 0 || courseLevels.length > 0;

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.id as string;
      const size = Math.sqrt(node.size * 2) * 2;
      const color = groupColors.get(node.group) || "#fff";

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw text label when zoomed in enough
      const ZOOM_THRESHOLD = 2;
      if (globalScale >= ZOOM_THRESHOLD) {
        const fontSize = Math.min(12 / globalScale, 4);
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Fade in label between zoom 2 and 4
        const opacity = Math.min((globalScale - ZOOM_THRESHOLD) / 2, 1);
        ctx.fillStyle = isLightMode
          ? `rgba(30, 29, 27, ${opacity})`
          : `rgba(255, 255, 255, ${opacity})`;
        ctx.fillText(label, node.x, node.y + size + fontSize * 0.8);
      }
    },
    [groupColors, isLightMode]
  );

  return (
    <div className="page graph-page">
      <main className="container">
        {/* Left Sidebar - Draggable */}
        {selectedCourseOutline && (
          <DraggablePanel
            anchor="top-left"
            defaultPosition={{ top: 20, left: 20 }}
            className="graph-panel graph-panel--sidebar"
            resizable
          >
            <SidebarCourse
              course={selectedCourseOutline}
              onClose={closeSidebar}
            />
          </DraggablePanel>
        )}

        {/* Floating Filter Menu - Draggable */}
        {isFilterOpen ? (
          <DraggablePanel
            anchor="top-right"
            defaultPosition={{ top: 20, right: 20 }}
            className="graph-panel graph-panel--filter"
          >
            <ExploreFilter simplified onClose={() => setIsFilterOpen(false)} />
          </DraggablePanel>
        ) : (
          <button
            className="filter-half-circle"
            onClick={() => setIsFilterOpen(true)}
            aria-label="Open Filters"
          >
            <MdFilterList size={24} />
          </button>
        )}

        <div className="graph-legend" aria-label="Edge legend">
          <span>
            <svg width="28" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="28" y2="4" className="legend-required" />
            </svg>
            required
          </span>
          <span>
            <svg width="28" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="28"
                y2="4"
                className="legend-alternative"
                strokeDasharray="4 2"
              />
            </svg>
            one of
          </span>
          <span>
            <svg width="28" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="28" y2="4" className="legend-coreq" />
            </svg>
            corequisite
          </span>
        </div>

        {/* Graph Canvas */}
        <section>
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            backgroundColor={isLightMode ? "#f5f2eb" : "#1e1e1e"}
            nodeLabel="id"
            // Use bottom-up DAG only when filtered, otherwise use default force layout
            dagMode={hasFilters ? "bu" : undefined}
            dagLevelDistance={hasFilters ? 40 : undefined}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(
              node: any,
              color: string,
              ctx: CanvasRenderingContext2D
            ) => {
              const size = Math.sqrt(node.size * 2) * 2;
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkLabel={(link: any) => link.label}
            linkLineDash={(link: any) =>
              link.type === "alternative" ? [4, 2] : null
            }
            linkWidth={(link: any) => (link.type === "corequisite" ? 1.5 : 1.2)}
            linkColor={(link: any) =>
              link.type === "corequisite"
                ? isLightMode
                  ? "rgba(200, 120, 0, 0.7)"
                  : "rgba(255, 165, 0, 0.6)"
                : isLightMode
                ? "rgba(60, 130, 200, 0.6)"
                : "rgba(100, 200, 255, 0.5)"
            }
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            linkCurvature={(link: any) =>
              link.type === "corequisite" ? 0.3 : 0
            }
            onNodeClick={handleNodeClick}
            onZoom={(transform: any) => setZoomLevel(transform.k)}
          />
        </section>
      </main>
    </div>
  );
};

export default GraphPage;
