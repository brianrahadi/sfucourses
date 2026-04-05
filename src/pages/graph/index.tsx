import { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { SidebarCourse } from "@components";
import { CourseOutline } from "@types";

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
}

interface GraphPageProps {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const getStaticProps: GetStaticProps<GraphPageProps> = async () => {
  const nodesPath = path.join(process.cwd(), "public/courses/nodes.csv");
  const linksPath = path.join(process.cwd(), "public/courses/links.csv");

  const nodesCsv = fs.readFileSync(nodesPath, "utf-8");
  const linksCsv = fs.readFileSync(linksPath, "utf-8");

  const parsedNodes = Papa.parse(nodesCsv, {
    header: true,
    skipEmptyLines: true,
  });
  const parsedLinks = Papa.parse(linksCsv, {
    header: true,
    skipEmptyLines: true,
  });

  const nodes = parsedNodes.data.map((r: any) => ({
    id: r.id,
    title: r.title,
    group: r.group,
    size: parseFloat(r.size) || 1,
    depth: parseFloat(r.depth) || 1,
  }));

  const links = parsedLinks.data.map((r: any) => ({
    source: r.source,
    target: r.target,
    value: parseFloat(r.value) || 1,
  }));

  return {
    props: {
      nodes,
      links,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", updateDimensions);
    updateDimensions();

    return () => window.removeEventListener("resize", updateDimensions);
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
    if (!searchQuery.trim()) {
      return { nodes: nodes, links: links };
    }

    const query = searchQuery.toLowerCase().trim();
    const filteredNodes = nodes.filter(
      (n) =>
        n.id.toLowerCase().includes(query) ||
        n.group.toLowerCase().includes(query) ||
        (n.title && n.title.toLowerCase().includes(query))
    );

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

    const filteredLinks = links.filter((l) => {
      const sourceId =
        typeof l.source === "object" ? (l.source as any).id : l.source;
      const targetId =
        typeof l.target === "object" ? (l.target as any).id : l.target;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, searchQuery]);

  return (
    <div
      className="page graph-page"
      style={{ height: "100vh", padding: 0, margin: 0, overflow: "hidden" }}
    >
      <Head>
        <title>Curriculum Graph - SFU Courses</title>
      </Head>

      <main
        id="schedule-container"
        className="container"
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          maxWidth: "100%",
          height: "100%",
          display: "flex",
        }}
      >
        {/* Left Sidebar Native Layout (Mirrors courses-section in schedule) */}
        {selectedCourseOutline && (
          <section
            className="courses-section"
            style={{
              width: "400px",
              minWidth: "400px",
              height: "100%",
              overflowY: "auto",
              borderRight: "1px solid var(--colour-neutral-800)",
              backgroundColor: "var(--colour-background)",
            }}
          >
            <SidebarCourse
              course={selectedCourseOutline}
              onClose={closeSidebar}
            />
          </section>
        )}

        {/* Right Layout (Mirrors schedule-section but holds graph) */}
        <section
          className="schedule-section"
          style={{
            flexGrow: 1,
            position: "relative",
            height: "100%",
            backgroundColor: "#1e1e1e",
            overflow: "hidden",
          }}
          ref={containerRef}
        >
          {/* Floating Search Bar */}
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              zIndex: 10,
            }}
          >
            <input
              type="text"
              placeholder="Filter courses... (e.g. CMPT)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid var(--colour-neutral-800)",
                backgroundColor: "var(--colour-neutral-1000)",
                color: "white",
                fontSize: "14px",
                width: "300px",
                outline: "none",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
              }}
            />
          </div>

          {dimensions.width > 0 && dimensions.height > 0 && (
            <ForceGraph2D
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel="id"
              nodeColor={(node: any) => groupColors.get(node.group) || "#fff"}
              nodeVal={(node: any) => node.size * 2}
              linkWidth={1}
              linkColor={() => "rgba(255,255,255,0.2)"}
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default GraphPage;
