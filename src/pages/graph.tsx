import { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import fs from "fs";
import path from "path";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { SidebarCourse, ExploreFilter } from "@components";
import { useExploreStore } from "src/store/useExploreStore";
import { CourseOutline } from "@types";
import { MdFilterList, MdClose } from "react-icons/md";

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
  type?: "prerequisite" | "corequisite";
}

interface GraphPageProps {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const getStaticProps: GetStaticProps<GraphPageProps> = async () => {
  const coursesPath = path.join(process.cwd(), "public/courses/courses.json");
  const coursesRaw = fs.readFileSync(coursesPath, "utf-8");
  const courses = JSON.parse(coursesRaw);

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

    c.prerequisites?.forEach((prereq: string) => {
      rawLinks.push({
        source: prereq,
        target: id,
        value: 1,
        type: "prerequisite",
      });
      if (!nodesMap.has(prereq)) {
        const pDept = prereq.split(" ")[0] || "UNKNOWN";
        nodesMap.set(prereq, {
          id: prereq,
          title: prereq,
          group: pDept,
          size: 5,
          depth: 1,
        });
      }
    });

    c.corequisites?.forEach((coreq: string) => {
      rawLinks.push({
        source: id,
        target: coreq,
        value: 1,
        type: "corequisite",
      });
      rawLinks.push({
        source: coreq,
        target: id,
        value: 1,
        type: "corequisite",
      });
      if (!nodesMap.has(coreq)) {
        const pDept = coreq.split(" ")[0] || "UNKNOWN";
        nodesMap.set(coreq, {
          id: coreq,
          title: coreq,
          group: pDept,
          size: 5,
          depth: 1,
        });
      }
    });
  });

  const uniqueLinksMap = new Map<string, GraphLink>();
  rawLinks.forEach((l) => {
    uniqueLinksMap.set(`${l.source}-${l.target}-${l.type}`, l);
  });

  return {
    props: {
      nodes: Array.from(nodesMap.values()),
      links: Array.from(uniqueLinksMap.values()),
    },
  };
};

const pastelColors = [
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

const GraphPage: React.FC<GraphPageProps> = ({ nodes, links }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const courseSubjects = useExploreStore((state) => state.courseSubjects);
  const courseLevels = useExploreStore((state) => state.courseLevels);

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
    const groups = Array.from(new Set(nodes.map((n) => n.group)));
    const colorMap = new Map<string, string>();
    groups.forEach((group, i) => {
      colorMap.set(group, pastelColors[i % pastelColors.length]);
    });
    return colorMap;
  }, [nodes]);

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

  return (
    <div className="page graph-page">
      <main className="container">
        {/* Left Sidebar Native Layout (Mirrors courses-section in schedule) */}
        {selectedCourseOutline && (
          <section className="courses-section">
            <SidebarCourse
              course={selectedCourseOutline}
              onClose={closeSidebar}
            />
          </section>
        )}

        {/* Right Layout (Mirrors schedule-section but holds graph) */}
        <section>
          {/* Floating Filter Menu */}
          <div
            className={`search-filter-container ${
              isFilterOpen ? "" : "closed"
            }`}
          >
            <ExploreFilter simplified onClose={() => setIsFilterOpen(false)} />
          </div>

          {!isFilterOpen && (
            <button
              className="filter-half-circle"
              onClick={() => setIsFilterOpen(true)}
              aria-label="Open Filters"
            >
              <MdFilterList size={24} />
            </button>
          )}

          <ForceGraph2D
            graphData={graphData}
            nodeLabel="id"
            // Use bottom-up DAG only when filtered, otherwise use default force layout
            dagMode={hasFilters ? "bu" : undefined}
            dagLevelDistance={hasFilters ? 40 : undefined}
            nodeColor={(node: any) => groupColors.get(node.group) || "#fff"}
            nodeVal={(node: any) => node.size * 2}
            linkWidth={(link: any) => (link.type === "corequisite" ? 1.5 : 1.2)}
            linkColor={(link: any) =>
              link.type === "corequisite"
                ? "rgba(255, 165, 0, 0.6)"
                : "rgba(100, 200, 255, 0.5)"
            }
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            linkCurvature={(link: any) =>
              link.type === "corequisite" ? 0.3 : 0
            }
            onNodeClick={handleNodeClick}
          />
        </section>
      </main>
    </div>
  );
};

export default GraphPage;
