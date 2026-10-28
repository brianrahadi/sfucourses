import Link from "next/link";
import { useMemo } from "react";
import { usePrereqGraph } from "src/hooks/usePrereqData";
import { buildExclusions, coursePath, exclusionPairs } from "@utils/prereqs";

interface CreditOverlapWarningProps {
  /** Selected course codes, e.g. ["CMPT 120", "CMPT 130"]. */
  codes: string[];
}

/**
 * Warns when the schedule contains courses SFU won't give credit for together
 * ("Students with credit for X may not take this course for further credit")
 * or that may not be taken in the same term.
 */
export const CreditOverlapWarning: React.FC<CreditOverlapWarningProps> = ({
  codes,
}) => {
  const { data: graph } = usePrereqGraph();
  const exclusions = useMemo(
    () => (graph ? buildExclusions(graph) : new Map<string, Set<string>>()),
    [graph]
  );
  const pairs = useMemo(
    () => exclusionPairs(codes, exclusions),
    [codes, exclusions]
  );

  if (pairs.length === 0) return null;

  return (
    <div className="credit-overlap-warning" role="status">
      <strong>Overlapping courses</strong>
      <ul>
        {pairs.map(([a, b]) => (
          <li key={`${a}-${b}`}>
            <Link href={coursePath(a)}>{a}</Link> and{" "}
            <Link href={coursePath(b)}>{b}</Link>: SFU won&apos;t give credit
            for both, or they can&apos;t be taken in the same term.
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CreditOverlapWarning;
