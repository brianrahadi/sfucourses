/**
 * Prerequisite helpers shared by the graph, degree, course and schedule pages.
 * Data comes from the API's parsed catalog:
 *   GET /v1/rest/prerequisites        -> full and/or trees (PrereqNode)
 *   GET /v1/rest/prerequisites/graph  -> per-course flat entries (PrereqGraphEntry)
 */

export interface PrereqGraphEntry {
  dept: string;
  number: string;
  /** Every course code mentioned as a prerequisite. */
  prerequisites: string[];
  /** Requirements as groups that must all be met, one course from each. */
  groups?: string[][];
  corequisites: string[];
  /** Courses SFU won't credit together with this one / can't take concurrently. */
  exclusions?: string[];
}

export interface PrereqNode {
  type: "and" | "or" | "course";
  /** Course code, or a special leaf: "UNITS:45", "PERMISSION:...", "COREQUISITE:MATH 151". */
  id?: string;
  children?: PrereqNode[];
}

export type PrereqTrees = Record<string, PrereqNode>;

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

/**
 * Runtime check that API data has the shape the pages rely on, so a malformed
 * response (e.g. `prerequisites: {}`) falls back to the snapshot instead of
 * throwing later. `groups` and `exclusions` are optional (older snapshots).
 */
export function isPrereqGraph(data: unknown): data is PrereqGraphEntry[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.every(
      (e) =>
        e !== null &&
        typeof e === "object" &&
        typeof e.dept === "string" &&
        typeof e.number === "string" &&
        isStringArray(e.prerequisites) &&
        isStringArray(e.corequisites) &&
        (e.groups === undefined ||
          (Array.isArray(e.groups) && e.groups.every(isStringArray))) &&
        (e.exclusions === undefined || isStringArray(e.exclusions))
    )
  );
}

export const courseCode = (e: { dept: string; number: string }) =>
  `${e.dept.toUpperCase()} ${e.number.toUpperCase()}`;

/** "/explore/cmpt-225" for "CMPT 225". */
export const coursePath = (code: string) => {
  const [dept, number] = code.split(" ");
  return `/explore/${dept.toLowerCase()}-${number}`;
};

/**
 * Groups for an entry; older snapshots without `groups` treat every listed
 * prerequisite as required.
 */
export const groupsOf = (e: PrereqGraphEntry): string[][] =>
  e.groups ?? e.prerequisites.map((p) => [p]);

/** Build an and/or tree from groups (used when full trees are unavailable). */
export const treeFromGroups = (groups: string[][]): PrereqNode | undefined => {
  if (groups.length === 0) return undefined;
  const nodes: PrereqNode[] = groups.map((g) =>
    g.length === 1
      ? { type: "course", id: g[0] }
      : { type: "or", children: g.map((id) => ({ type: "course", id })) }
  );
  return nodes.length === 1 ? nodes[0] : { type: "and", children: nodes };
};

export type Eligibility = "met" | "permission" | "unmet";

export interface EligibilityContext {
  /** Courses counted as done (completed, and in-progress when planning next term). */
  done: Set<string>;
  /** Credits completed (plus in progress), for "45 units" style requirements. */
  credits: number;
}

const rank: Record<Eligibility, number> = { unmet: 0, permission: 1, met: 2 };

/**
 * Evaluate a requirement tree. "permission" means the only way through is a
 * permission/approval clause; corequisites count as met because they can be
 * taken in the same term.
 */
export function evaluate(
  node: PrereqNode | undefined,
  ctx: EligibilityContext
): Eligibility {
  if (!node) return "met";
  if (node.type === "course") {
    const id = node.id ?? "";
    if (id.startsWith("UNITS:")) {
      return ctx.credits >= Number(id.slice(6)) ? "met" : "unmet";
    }
    if (id.startsWith("PERMISSION:")) return "permission";
    if (id.startsWith("COREQUISITE:")) return "met";
    return ctx.done.has(id) ? "met" : "unmet";
  }
  const results = (node.children ?? []).map((c) => evaluate(c, ctx));
  if (results.length === 0) return "met";
  const pick = node.type === "and" ? Math.min : Math.max;
  const best = pick(...results.map((r) => rank[r]));
  return (Object.keys(rank) as Eligibility[]).find((k) => rank[k] === best)!;
}

/** Course codes in a tree, ignoring UNITS:/PERMISSION: leaves. */
export function treeCourses(node: PrereqNode | undefined): string[] {
  if (!node) return [];
  if (node.type === "course") {
    const id = node.id ?? "";
    if (id.startsWith("COREQUISITE:")) return [id.slice(12)];
    return id.includes(":") ? [] : [id];
  }
  return (node.children ?? []).flatMap(treeCourses);
}

/** For each course, the courses that list it as a prerequisite. */
export function buildUnlocks(graph: PrereqGraphEntry[]): Map<string, string[]> {
  const unlocks = new Map<string, string[]>();
  for (const e of graph) {
    const target = courseCode(e);
    for (const p of e.prerequisites) {
      const list = unlocks.get(p) ?? [];
      if (!list.includes(target)) list.push(target);
      unlocks.set(p, list);
    }
  }
  unlocks.forEach((list) => list.sort());
  return unlocks;
}

/** Symmetric exclusion lookup: course -> courses it can't be combined with. */
export function buildExclusions(
  graph: PrereqGraphEntry[]
): Map<string, Set<string>> {
  const ex = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!ex.has(a)) ex.set(a, new Set());
    ex.get(a)!.add(b);
  };
  for (const e of graph) {
    const code = courseCode(e);
    for (const other of e.exclusions ?? []) {
      add(code, other);
      add(other, code);
    }
  }
  return ex;
}

/** Pairs among `codes` that SFU won't credit together / allow concurrently. */
export function exclusionPairs(
  codes: string[],
  exclusions: Map<string, Set<string>>
): [string, string][] {
  const pairs: [string, string][] = [];
  const unique = Array.from(new Set(codes)).sort();
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      if (exclusions.get(unique[i])?.has(unique[j])) {
        pairs.push([unique[i], unique[j]]);
      }
    }
  }
  return pairs;
}
