import Link from "next/link";
import { useMemo, useState } from "react";
import { usePrereqGraph } from "src/hooks/usePrereqData";
import { buildExclusions, buildUnlocks, coursePath } from "@utils/prereqs";

const PREVIEW = 18;

interface CourseRelationsProps {
  dept: string;
  number: string;
}

/**
 * "Unlocks" (courses that list this one as a prerequisite) and "No extra
 * credit with" (courses SFU won't credit together with this one), from the
 * API's parsed prerequisite graph.
 */
export const CourseRelations: React.FC<CourseRelationsProps> = ({
  dept,
  number,
}) => {
  const { data: graph } = usePrereqGraph();
  const [showAll, setShowAll] = useState(false);
  const code = `${dept.toUpperCase()} ${number.toUpperCase()}`;

  const { unlocks, exclusions } = useMemo(() => {
    if (!graph) return { unlocks: [], exclusions: [] };
    return {
      unlocks: buildUnlocks(graph).get(code) ?? [],
      exclusions: Array.from(buildExclusions(graph).get(code) ?? []).sort(),
    };
  }, [graph, code]);

  if (unlocks.length === 0 && exclusions.length === 0) return null;
  const shown = showAll ? unlocks : unlocks.slice(0, PREVIEW);

  return (
    <div className="course-relations">
      {unlocks.length > 0 && (
        <>
          <h2 className="coreq-heading">
            Unlocks <span className="relation-count">{unlocks.length}</span>
          </h2>
          <p className="relation-hint">
            Courses that list {code} as a prerequisite (alone or as one option).
          </p>
          <div className="relation-chips">
            {shown.map((c) => (
              <Link key={c} href={coursePath(c)} className="relation-chip">
                {c}
              </Link>
            ))}
            {unlocks.length > PREVIEW && (
              <button
                className="relation-chip relation-chip--more"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show less" : `+${unlocks.length - PREVIEW} more`}
              </button>
            )}
          </div>
        </>
      )}

      {exclusions.length > 0 && (
        <>
          <h2 className="coreq-heading">No extra credit with</h2>
          <p className="relation-hint">
            SFU won&apos;t give credit for both, or they can&apos;t be taken in
            the same term.
          </p>
          <div className="relation-chips">
            {exclusions.map((c) => (
              <Link
                key={c}
                href={coursePath(c)}
                className="relation-chip relation-chip--warn"
              >
                {c}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CourseRelations;
