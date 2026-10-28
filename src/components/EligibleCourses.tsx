import Link from "next/link";
import { useMemo, useState } from "react";
import { CourseOutline } from "@types";
import { usePrereqGraph, usePrereqTrees } from "src/hooks/usePrereqData";
import {
  Eligibility,
  PrereqNode,
  buildExclusions,
  courseCode,
  coursePath,
  evaluate,
  groupsOf,
  treeCourses,
  treeFromGroups,
} from "@utils/prereqs";

const PAGE = 24;

interface EligibleCoursesProps {
  /** Completed course codes. */
  completed: string[];
  /** Courses being taken now; counted as done when planning next term. */
  inProgress: string[];
  /** Courses already planned for a future term (hidden from suggestions). */
  planned: string[];
  /** Completed + in-progress credits, for "45 units" style requirements. */
  credits: number;
  nextTerm: string;
  courses: CourseOutline[];
  onAdd: (code: string, units: number) => void;
}

interface Suggestion {
  code: string;
  title: string;
  units: number;
  status: Eligibility;
  /** Courses of yours that this requirement uses. */
  via: string[];
}

/**
 * Courses whose prerequisites are met by what the student has done (or is
 * doing) and that mention at least one of those courses, i.e. what their
 * courses unlock. Courses with no prerequisites are left out so the list stays
 * about progression.
 */
export const EligibleCourses: React.FC<EligibleCoursesProps> = ({
  completed,
  inProgress,
  planned,
  credits,
  nextTerm,
  courses,
  onAdd,
}) => {
  const { data: graph } = usePrereqGraph();
  const { data: trees } = usePrereqTrees();
  const [dept, setDept] = useState("All");
  const [limit, setLimit] = useState(PAGE);

  const offeredNextTerm = useMemo(
    () => courses.some((c) => c.offerings?.some((o) => o.term === nextTerm)),
    [courses, nextTerm]
  );
  const [onlyOffered, setOnlyOffered] = useState(true);
  const filterOffered = onlyOffered && offeredNextTerm;

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!graph || (completed.length === 0 && inProgress.length === 0)) {
      return [];
    }
    const done = new Set([...completed, ...inProgress]);
    const skip = new Set([...done, ...planned]);
    const exclusions = buildExclusions(graph);
    const byCode = new Map(courses.map((c) => [courseCode(c), c]));
    const ctx = { done, credits };

    const out: Suggestion[] = [];
    for (const entry of graph) {
      const code = courseCode(entry);
      if (skip.has(code)) continue;
      // SFU won't credit it alongside something already done
      if (Array.from(exclusions.get(code) ?? []).some((x) => done.has(x))) {
        continue;
      }
      const outline = byCode.get(code);
      if (
        filterOffered &&
        !outline?.offerings?.some((o) => o.term === nextTerm)
      ) {
        continue;
      }
      const tree: PrereqNode | undefined =
        trees?.[code] ?? treeFromGroups(groupsOf(entry));
      if (!tree) continue;
      const via = treeCourses(tree).filter((c) => done.has(c));
      if (via.length === 0) continue;
      const status = evaluate(tree, ctx);
      if (status === "unmet") continue;
      out.push({
        code,
        title: outline?.title ?? "",
        units: Number(outline?.units) || 3,
        status,
        via: Array.from(new Set(via)),
      });
    }
    return out.sort(
      (a, b) =>
        (a.status === "met" ? 0 : 1) - (b.status === "met" ? 0 : 1) ||
        a.code.localeCompare(b.code, undefined, { numeric: true })
    );
  }, [
    graph,
    trees,
    completed,
    inProgress,
    planned,
    credits,
    courses,
    nextTerm,
    filterOffered,
  ]);

  const depts = useMemo(
    () => Array.from(new Set(suggestions.map((s) => s.code.split(" ")[0]))),
    [suggestions]
  );
  const visible = suggestions.filter(
    (s) => dept === "All" || s.code.startsWith(`${dept} `)
  );

  return (
    <div className="db-card eligible-card">
      <div className="card-header">
        <h2>
          ELIGIBLE NEXT TERM — {nextTerm.toUpperCase()}{" "}
          {suggestions.length > 0 && (
            <span className="eligible-count">({visible.length})</span>
          )}
        </h2>
        <div className="eligible-controls">
          {offeredNextTerm && (
            <label className="eligible-toggle">
              <input
                type="checkbox"
                checked={onlyOffered}
                onChange={(e) => setOnlyOffered(e.target.checked)}
              />
              offered {nextTerm}
            </label>
          )}
          {depts.length > 1 && (
            <select
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                setLimit(PAGE);
              }}
              aria-label="Filter by subject"
            >
              <option value="All">All subjects</option>
              {depts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {completed.length === 0 && inProgress.length === 0 ? (
        <p className="eligible-empty">
          Add completed or in-progress courses to see what they unlock.
        </p>
      ) : !graph ? (
        <p className="eligible-empty">Loading prerequisites…</p>
      ) : visible.length === 0 ? (
        <p className="eligible-empty">
          Nothing new unlocked
          {filterOffered ? ` among courses offered in ${nextTerm}` : ""} yet.
        </p>
      ) : (
        <>
          <ul className="eligible-list">
            {visible.slice(0, limit).map((s) => (
              <li key={s.code} className="eligible-item">
                <div className="eligible-main">
                  <Link href={coursePath(s.code)} className="eligible-code">
                    {s.code}
                  </Link>
                  <span className="eligible-title">{s.title}</span>
                  <span className="eligible-via">
                    via {s.via.join(", ")}
                    {s.status === "permission" && (
                      <span className="eligible-badge">needs permission</span>
                    )}
                  </span>
                </div>
                <button
                  className="add-btn"
                  onClick={() => onAdd(s.code, s.units)}
                  title={`Plan ${s.code} for ${nextTerm}`}
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
          {visible.length > limit && (
            <button
              className="eligible-more"
              onClick={() => setLimit(limit + PAGE)}
            >
              Show {Math.min(PAGE, visible.length - limit)} more
            </button>
          )}
          <p className="eligible-note">
            Based on parsed catalog prerequisites
            {inProgress.length > 0 ? ", counting in-progress courses" : ""}.
            Grade minimums and program restrictions aren&apos;t checked.
          </p>
        </>
      )}
    </div>
  );
};

export default EligibleCourses;
