import { useState, useMemo, useEffect, useRef } from "react";
import {
  Hero,
  CatalogModal,
  CourseCombobox,
  CatalogCourseCard,
  CopyLinkButton,
  CatalogManager,
} from "@components";
import ButtonGroup from "../components/ButtonGroup";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useCatalogStore, CompletedCourse } from "src/store/useCatalogStore";
import { useCoursesData } from "src/hooks/UseCoursesData";
import { getCurrentAndNextTerm } from "@utils";
import toast from "react-hot-toast";
import { OutlineOption } from "src/components/CourseCombobox";
import { insertUrlParam, removeUrlParameter } from "@utils/url";
import { FaImage } from "react-icons/fa";
import html2canvas from "html2canvas";

const seasonToAbbrev: Record<string, string> = {
  Spring: "sp",
  Summer: "su",
  Fall: "fa",
};
const abbrevToSeason: Record<string, string> = {
  sp: "Spring",
  su: "Summer",
  fa: "Fall",
};

function encodeCourse(id: string, term: string): string {
  const [season, year] = term.split(" ");
  const abbrev = seasonToAbbrev[season] || "sp";
  const shortYear = (year || "00").slice(-2);
  return `${id.replace(" ", "").toLowerCase()}${abbrev}${shortYear}`;
}

function decodeCourse(encoded: string): { id: string; term: string } | null {
  // Match: dept (letters), number (digits + optional letters like W), season abbrev (2 chars), year (2 digits)
  const match = encoded.match(/^([a-z]+)(\d+\w*?)(sp|su|fa)(\d{2})$/i);
  if (!match) return null;
  const dept = match[1].toUpperCase();
  const number = match[2].toUpperCase();
  const season = abbrevToSeason[match[3].toLowerCase()];
  const year = `20${match[4]}`;
  if (!season) return null;
  return { id: `${dept} ${number}`, term: `${season} ${year}` };
}

const ProgressPage = () => {
  const {
    completedCourses,
    wishlistCourses,
    addCompletedCourse,
    removeCompletedCourse,
    addWishlistCourse,
    removeWishlistCourse,
  } = useCatalogStore();
  const { courses } = useCoursesData();
  const [currentTerm, nextTerm] = getCurrentAndNextTerm();

  const currentYearStr =
    currentTerm.split(" ")[1] || new Date().getFullYear().toString();

  const [isAddCompletedOpen, setIsAddCompletedOpen] = useState(false);
  const [isInProgressOpen, setIsInProgressOpen] = useState(false);
  const [isNextTermOpen, setIsNextTermOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMassAddOpen, setIsMassAddOpen] = useState(false);
  const [massAddJson, setMassAddJson] = useState("");
  const [completedSort, setCompletedSort] = useState<"Term" | "A-Z">("Term");

  const [courseInput, setCourseInput] = useState("");
  const [selectedCourseTerm, setSelectedCourseTerm] = useState(currentTerm);

  const [dragHoverTarget, setDragHoverTarget] = useState<string | null>(null);
  const [draggedItemData, setDraggedItemData] = useState<{
    id: string;
    title: string;
    credits: number;
    term?: string;
    accentColor: "green" | "blue" | "grey";
    sourceSection: string;
  } | null>(null);

  const [outlineOptions, setOutlineOptions] = useState<OutlineOption[]>([]);

  const [catalogName, setCatalogName] = useState("Your name...");
  const [targetCredits, setTargetCredits] = useState(120);

  const [mounted, setMounted] = useState(false);
  const loadedFromUrl = useRef(false);

  useEffect(() => {
    setMounted(true);
    const savedName = localStorage.getItem("catalog-name");
    if (savedName) setCatalogName(savedName);
    const savedTarget = localStorage.getItem("catalog-target-credits");
    if (savedTarget) setTargetCredits(parseInt(savedTarget) || 120);
  }, []);

  // Load courses from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const coursesParam = params.get("courses");
    if (!coursesParam) return;

    const encoded = coursesParam.split("-").filter(Boolean);
    if (encoded.length === 0) return;

    loadedFromUrl.current = true;
    encoded.forEach((code) => {
      const decoded = decodeCourse(code);
      if (!decoded) return;
      const exists = completedCourses.some(
        (c) => c.id === decoded.id && c.term === decoded.term
      );
      if (!exists) {
        addCompletedCourse({ id: decoded.id, term: decoded.term, credits: 3 });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync completed courses to URL
  useEffect(() => {
    if (!mounted) return;
    if (completedCourses.length === 0) {
      removeUrlParameter("courses");
      return;
    }
    const encoded = completedCourses
      .map((c) => encodeCourse(c.id, c.term))
      .join("-");
    insertUrlParam("courses", encoded);
  }, [completedCourses, mounted]);

  useEffect(() => {
    fetch("https://api.sfucourses.com/v1/rest/outlines?short=true")
      .then((res) => res.json())
      .then((data) => setOutlineOptions(data))
      .catch((err) => console.error("Error fetching outlines:", err));
  }, []);

  const chronologicalTerms = useMemo(() => {
    const seasons = ["Spring", "Summer", "Fall"];
    const startYear = 2017;
    const endYear = parseInt(currentYearStr);

    const terms = [];
    for (let y = endYear + 2; y >= startYear; y--) {
      for (let i = seasons.length - 1; i >= 0; i--) {
        if (y === 2017 && i < seasons.indexOf("Fall")) continue;
        terms.push(`${seasons[i]} ${y}`);
      }
    }
    return terms;
  }, [currentYearStr]);

  const futureTerms = useMemo(() => {
    const seasons = { Spring: 1, Summer: 2, Fall: 3 };
    const [seasonN, yearN] = nextTerm.split(" ");
    const nextTermValue =
      parseInt(yearN || "0") * 10 +
      (seasons[seasonN as keyof typeof seasons] || 0);

    return chronologicalTerms.filter((t) => {
      const [seasonT, yearT] = t.split(" ");
      const tValue =
        parseInt(yearT || "0") * 10 +
        (seasons[seasonT as keyof typeof seasons] || 0);
      return tValue > nextTermValue;
    });
  }, [chronologicalTerms, nextTerm]);

  const pastTerms = useMemo(() => {
    const seasons = { Spring: 1, Summer: 2, Fall: 3 };
    const [seasonC, yearC] = currentTerm.split(" ");
    const currentTermValue =
      parseInt(yearC || "0") * 10 +
      (seasons[seasonC as keyof typeof seasons] || 0);

    return chronologicalTerms.filter((t) => {
      const [seasonT, yearT] = t.split(" ");
      const tValue =
        parseInt(yearT || "0") * 10 +
        (seasons[seasonT as keyof typeof seasons] || 0);
      return tValue < currentTermValue;
    });
  }, [chronologicalTerms, currentTerm]);

  const totalCompletedCredits = useMemo(() => {
    return completedCourses.reduce(
      (sum, course) => sum + (Number(course.credits) || 0),
      0
    );
  }, [completedCourses]);

  const inProgressCourses = useMemo(() => {
    return wishlistCourses.filter((c) => c.termPlanned === currentTerm);
  }, [wishlistCourses, currentTerm]);

  const coursesToTake = useMemo(() => {
    return wishlistCourses.filter((c) => c.termPlanned !== currentTerm);
  }, [wishlistCourses, currentTerm]);

  const totalInProgressCredits = useMemo(() => {
    return inProgressCourses.reduce(
      (sum, course) => sum + (Number(course.credits) || 3),
      0
    );
  }, [inProgressCourses]);

  const progressPercentage = Math.min(
    (totalCompletedCredits / (targetCredits || 1)) * 100,
    100
  );
  const creditsRemaining = Math.max(
    targetCredits - totalCompletedCredits - totalInProgressCredits,
    0
  );

  const currentTermOptions = useMemo(() => {
    if (!courses || courses.length === 0) return outlineOptions;
    const filtered = courses.filter(
      (c) => c.offerings && c.offerings.some((o) => o.term === currentTerm)
    );
    if (filtered.length === 0) return outlineOptions;
    return filtered.map((c) => ({
      dept: c.dept,
      number: c.number,
      title: c.title,
      units: Number(c.units) || 3,
    }));
  }, [courses, currentTerm, outlineOptions]);

  const futureCourseOptions = useMemo(() => {
    if (selectedCourseTerm === "Undecided" || !selectedCourseTerm)
      return outlineOptions;
    if (!courses || courses.length === 0) return outlineOptions;
    const filtered = courses.filter(
      (c) =>
        c.offerings && c.offerings.some((o) => o.term === selectedCourseTerm)
    );
    if (filtered.length === 0) return outlineOptions;
    return filtered.map((c) => ({
      dept: c.dept,
      number: c.number,
      title: c.title,
      units: Number(c.units) || 3,
    }));
  }, [courses, selectedCourseTerm, outlineOptions]);

  const nextTermOptions = useMemo(() => {
    if (!courses || courses.length === 0) return outlineOptions;
    const filtered = courses.filter(
      (c) => c.offerings && c.offerings.some((o) => o.term === nextTerm)
    );
    if (filtered.length === 0) return outlineOptions;
    return filtered.map((c) => ({
      dept: c.dept,
      number: c.number,
      title: c.title,
      units: Number(c.units) || 3,
    }));
  }, [courses, nextTerm, outlineOptions]);

  const getCourseMatch = (courseId: string) => {
    const parts = courseId.trim().toUpperCase().split(" ");
    if (parts.length < 2) return null;
    const [dept, number] = parts;
    const match = outlineOptions.find(
      (c) => c.dept.toUpperCase() === dept && c.number.toUpperCase() === number
    );
    if (match) return { title: match.title, units: Number(match.units) || 0 };

    if (courses) {
      const fallbackMatch = courses.find(
        (c) => c.dept === dept && c.number === number
      );
      if (fallbackMatch)
        return {
          title: fallbackMatch.title,
          units: Number(fallbackMatch.units) || 3,
        };
    }
    return null;
  };

  const getCourseTitle = (courseId: string) => {
    const match = getCourseMatch(courseId);
    return match ? match.title : "Unknown Course";
  };

  const checkCourseExists = (courseId: string) => {
    const normalizedId = courseId.trim().toUpperCase();
    if (completedCourses.some((c) => c.id === normalizedId)) return "completed";
    const wishlistMatch = wishlistCourses.find((c) => c.id === normalizedId);
    if (wishlistMatch) {
      if (wishlistMatch.termPlanned === currentTerm) return "in progress";
      return "courses to take";
    }
    return null;
  };

  const isTermBeforeCurrent = (term: string) => {
    if (!term || term === "Undecided") return false;
    const seasons: Record<string, number> = { Spring: 1, Summer: 2, Fall: 3 };
    const [seasonA, yearA] = term.split(" ");
    const [seasonB, yearB] = currentTerm.split(" ");
    if (parseInt(yearA || "0") !== parseInt(yearB || "0"))
      return parseInt(yearA || "0") < parseInt(yearB || "0");
    return (seasons[seasonA] || 0) < (seasons[seasonB] || 0);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    sourceSection: string,
    courseId: string,
    courseTerm: string | undefined,
    credits: number,
    accentColor: "green" | "blue" | "grey"
  ) => {
    const data = {
      sourceSection,
      courseId,
      courseTerm,
      title: getCourseTitle(courseId),
      credits,
      accentColor,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    setDraggedItemData({
      id: courseId,
      title: getCourseTitle(courseId),
      credits,
      term: courseTerm,
      accentColor,
      sourceSection,
    });
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    targetSection: string
  ) => {
    e.preventDefault();
    if (dragHoverTarget !== targetSection) {
      setDragHoverTarget(targetSection);
    }
  };

  const handleDragEnd = () => {
    setDragHoverTarget(null);
    setDraggedItemData(null);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetSection: string
  ) => {
    e.preventDefault();
    setDragHoverTarget(null);
    setDraggedItemData(null);
    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      const { sourceSection, courseId, courseTerm } = data;

      if (sourceSection === targetSection) return;

      const match = getCourseMatch(courseId);
      const credits = match ? match.units : 3;

      // Validate before removing from source
      if (targetSection === "completed") {
        const completedTerm =
          courseTerm && courseTerm !== "Undecided" ? courseTerm : undefined;
        if (!completedTerm || !isTermBeforeCurrent(completedTerm)) {
          toast.error("Completed courses must be from a previous term");
          return;
        }
      } else if (targetSection === "in-progress" && courses) {
        const courseObj = courses.find(
          (c) =>
            `${c.dept} ${c.number}`.toUpperCase() === courseId.toUpperCase()
        );
        if (
          courseObj &&
          courseObj.offerings &&
          !courseObj.offerings.some((o) => o.term === currentTerm)
        ) {
          toast.error(`Course not offered in ${currentTerm}`);
          return;
        }
      } else if (targetSection === "next-term" && courses) {
        const courseObj = courses.find(
          (c) =>
            `${c.dept} ${c.number}`.toUpperCase() === courseId.toUpperCase()
        );
        if (
          courseObj &&
          courseObj.offerings &&
          !courseObj.offerings.some((o) => o.term === nextTerm)
        ) {
          toast.error(`Course not offered in ${nextTerm}`);
          return;
        }
      }

      if (sourceSection === "completed") {
        removeCompletedCourse(courseId, courseTerm);
      } else {
        removeWishlistCourse(courseId);
      }

      if (targetSection === "completed") {
        const completedTerm = courseTerm!;
        addCompletedCourse({
          id: courseId,
          term: completedTerm,
          credits,
        });
      } else if (targetSection === "in-progress") {
        addWishlistCourse({
          id: courseId,
          credits,
          termPlanned: currentTerm,
        });
      } else if (targetSection === "next-term") {
        addWishlistCourse({
          id: courseId,
          credits,
          termPlanned: nextTerm,
        });
      } else if (targetSection === "undecided") {
        addWishlistCourse({
          id: courseId,
          credits,
          termPlanned: undefined,
        });
      }
      toast.success(`Moved ${courseId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCompleted = () => {
    if (!courseInput.trim()) return toast.error("Please enter a course code");

    const existingSection = checkCourseExists(courseInput);
    if (existingSection)
      return toast.error(`Course already exists in ${existingSection}`);

    const courseMatch = getCourseMatch(courseInput);
    if (!courseMatch) return toast.error("Course not found in SFU API");

    const completedTerm =
      selectedCourseTerm === "Undecided" ? undefined : selectedCourseTerm;
    if (!completedTerm || !isTermBeforeCurrent(completedTerm)) {
      return toast.error("Completed courses must be from a previous term");
    }

    addCompletedCourse({
      id: courseInput.trim().toUpperCase(),
      term: completedTerm,
      credits: courseMatch.units || 0,
    });
    closeModals();
    toast.success("Course added to completed");
  };

  const handleAddInProgress = () => {
    if (!courseInput.trim()) return toast.error("Course code required");

    const existingSection = checkCourseExists(courseInput);
    if (existingSection)
      return toast.error(`Course already exists in ${existingSection}`);

    const courseMatch = getCourseMatch(courseInput);
    if (!courseMatch) return toast.error("Course not found in SFU API");

    addWishlistCourse({
      id: courseInput.trim().toUpperCase(),
      credits: courseMatch.units || 3,
      termPlanned: currentTerm,
    });
    closeModals();
    toast.success("Course added to in progress");
  };

  const handleAddNextTerm = () => {
    if (!courseInput.trim()) return toast.error("Course code required");

    const existingSection = checkCourseExists(courseInput);
    if (existingSection)
      return toast.error(`Course already exists in ${existingSection}`);

    const courseMatch = getCourseMatch(courseInput);
    if (!courseMatch) return toast.error("Course not found in SFU API");

    addWishlistCourse({
      id: courseInput.trim().toUpperCase(),
      credits: courseMatch.units || 3,
      termPlanned: nextTerm,
    });
    closeModals();
    toast.success("Course added to next term");
  };

  const handleAddWishlist = () => {
    if (!courseInput.trim()) return toast.error("Course code required");

    const existingSection = checkCourseExists(courseInput);
    if (existingSection)
      return toast.error(`Course already exists in ${existingSection}`);

    const courseMatch = getCourseMatch(courseInput);
    if (!courseMatch) return toast.error("Course not found in SFU API");

    addWishlistCourse({
      id: courseInput.trim().toUpperCase(),
      credits: courseMatch.units || 3,
      termPlanned:
        selectedCourseTerm === "Undecided" ? undefined : selectedCourseTerm,
    });
    closeModals();
    toast.success("Course added to courses to take");
  };

  const closeModals = () => {
    setIsAddCompletedOpen(false);
    setIsInProgressOpen(false);
    setIsNextTermOpen(false);
    setIsWishlistOpen(false);
    setIsMassAddOpen(false);
    setCourseInput("");
    setMassAddJson("");
  };

  const handleMassAdd = () => {
    try {
      const parsed = JSON.parse(massAddJson);
      if (!Array.isArray(parsed)) throw new Error("Expected JSON array");

      let addedCount = 0;
      parsed.forEach((entry) => {
        if (entry.course && entry.term) {
          let mappedTerm = entry.term;
          if (entry.term.match(/^\d{4}\s+\w+$/)) {
            const parts = entry.term.trim().split(/\s+/);
            mappedTerm = `${parts[1]} ${parts[0]}`;
          }

          const courseVal = entry.course.trim().toUpperCase();
          const parts = courseVal.split(/\s+/);
          if (parts.length >= 2) {
            const dept = parts[0];
            const number = parts.slice(1).join(" ");
            let credits = 3;
            const match = outlineOptions.find(
              (c) =>
                c.dept.toUpperCase() === dept &&
                c.number.toUpperCase() === number
            );
            if (match) {
              credits = Number(match.units) || 0;
            } else if (courses) {
              const fallbackMatch = courses.find(
                (c) => c.dept === dept && c.number === number
              );
              if (fallbackMatch) credits = Number(fallbackMatch.units) || 3;
            }

            addCompletedCourse({
              id: courseVal,
              term: mappedTerm,
              credits: credits || 3,
            });
            addedCount++;
          }
        }
      });

      toast.success(`Mass added ${addedCount} courses!`);
      closeModals();
    } catch (err) {
      toast.error("Invalid JSON format. Expected array of objects.");
    }
  };

  const nextTermCoursesToTake = coursesToTake.filter(
    (c) => c.termPlanned === nextTerm
  );
  const undecidedCoursesToTake = coursesToTake.filter(
    (c) => c.termPlanned !== nextTerm
  );

  const sortTerm = (a: string, b: string) => {
    const seasons = { Spring: 1, Summer: 2, Fall: 3 };
    const [seasonA, yearA] = a.split(" ");
    const [seasonB, yearB] = b.split(" ");
    if (yearA !== yearB) return parseInt(yearA || "0") - parseInt(yearB || "0");
    return (
      (seasons[seasonA as keyof typeof seasons] || 0) -
      (seasons[seasonB as keyof typeof seasons] || 0)
    );
  };

  const sortedCompletedCourses = useMemo(() => {
    const sorted = [...completedCourses];
    if (completedSort === "A-Z") {
      sorted.sort((a, b) => a.id.localeCompare(b.id));
    } else {
      sorted.sort((a, b) => {
        const diff = sortTerm(a.term, b.term);
        if (diff === 0) return a.id.localeCompare(b.id);
        return diff;
      });
    }
    return sorted;
  }, [completedCourses, completedSort]);

  if (!mounted) return null;

  return (
    <div className="page progress-page">
      {/* <Hero title="progress" backgroundImage={HeroImage.src} /> */}
      <main className="container">
        <div className="catalog-dashboard">
          {/* <div className="db-header">
            <div className="db-user-info">
              <h1>You</h1>
              <p>BSc Computer Science · Student ID: 20210482 · Year 3</p>
            </div>
          </div> */}
          <div className="catalog-toolbar">
            <div className="toolbar-left">
              <CatalogManager />
            </div>

            <input
              type="text"
              value={catalogName}
              onChange={(e) => {
                setCatalogName(e.target.value);
                localStorage.setItem("catalog-name", e.target.value);
              }}
              className="catalog-title-input"
            />

            <div className="toolbar-right">
              <CopyLinkButton
                hasSelectedCourses={completedCourses.length > 0}
              />
              <button
                className="utility-button"
                onClick={async () => {
                  try {
                    const el = document.querySelector(".catalog-dashboard");
                    if (!el) return;
                    const canvas = await html2canvas(el as HTMLElement, {
                      backgroundColor: "#141515",
                      scale: 2,
                      logging: false,
                    });
                    canvas.toBlob(async (blob) => {
                      if (!blob) return;
                      try {
                        await navigator.clipboard.write([
                          new ClipboardItem({ "image/png": blob }),
                        ]);
                        toast.success("Progress image copied to clipboard!");
                      } catch {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "sfu-progress.png";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }, "image/png");
                  } catch (err) {
                    toast.error("Failed to capture image");
                  }
                }}
                disabled={completedCourses.length === 0}
                title="Copy progress as image"
              >
                <FaImage />
                <span className="hide-on-mobile">&nbsp; Copy Image</span>
              </button>
            </div>
          </div>
          <div className="db-progress-section">
            <div className="progress-header">
              <span>Overall degree progress</span>
              <span className="progress-text">
                {totalCompletedCredits} /{" "}
                <input
                  type="number"
                  value={targetCredits}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setTargetCredits(val);
                    localStorage.setItem(
                      "catalog-target-credits",
                      val.toString()
                    );
                  }}
                  className="target-credits-input"
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "inherit",
                    width: "40px",
                    fontWeight: "inherit",
                    fontSize: "inherit",
                    textAlign: "center",
                    padding: 0,
                  }}
                />{" "}
                credits
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="db-main-grid">
            {/* Left Column: In Progress */}
            <div className="db-card">
              <div className="card-header">
                <h2>
                  IN PROGRESS — {currentTerm.toUpperCase()}{" "}
                  <span
                    style={{
                      color: "var(--colour-neutral-500)",
                      fontWeight: "normal",
                    }}
                  >
                    ({totalInProgressCredits} CR)
                  </span>
                </h2>
                <button
                  className="add-btn"
                  onClick={() => setIsInProgressOpen(true)}
                >
                  Add
                </button>
              </div>
              <div
                className="course-stack"
                onDragOver={(e) => handleDragOver(e, "in-progress")}
                onDrop={(e) => handleDrop(e, "in-progress")}
                style={{ minHeight: "100px" }}
              >
                {inProgressCourses.length === 0 &&
                (!dragHoverTarget ||
                  dragHoverTarget !== "in-progress" ||
                  draggedItemData?.sourceSection === "in-progress") ? (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--colour-neutral-400)",
                    }}
                  >
                    No courses currently in progress.
                  </p>
                ) : null}
                {inProgressCourses.map((c) => (
                  <CatalogCourseCard
                    key={c.id}
                    id={c.id}
                    title={getCourseTitle(c.id)}
                    credits={c.credits || 3}
                    term={currentTerm}
                    onRemove={() => removeWishlistCourse(c.id)}
                    accentColor="blue"
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(
                        e,
                        "in-progress",
                        c.id,
                        currentTerm,
                        c.credits || 3,
                        "blue"
                      )
                    }
                    onDragEnd={handleDragEnd}
                  />
                ))}
                {dragHoverTarget === "in-progress" &&
                  draggedItemData &&
                  draggedItemData.sourceSection !== "in-progress" && (
                    <CatalogCourseCard
                      id={draggedItemData.id}
                      title={draggedItemData.title}
                      credits={draggedItemData.credits}
                      term={currentTerm}
                      onRemove={() => {}}
                      accentColor="blue"
                      isSkeleton
                    />
                  )}
              </div>
            </div>
            {/* Middle Column: Next Term */}
            <div
              className="db-card"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div className="card-header">
                <h2>NEXT TERM — {nextTerm.toUpperCase()} </h2>
                <button
                  className="add-btn"
                  onClick={() => setIsNextTermOpen(true)}
                >
                  Add
                </button>
              </div>

              <div
                className="course-stack"
                onDragOver={(e) => handleDragOver(e, "next-term")}
                onDrop={(e) => handleDrop(e, "next-term")}
                style={{ minHeight: "80px" }}
              >
                {nextTermCoursesToTake.length === 0 &&
                (!dragHoverTarget ||
                  dragHoverTarget !== "next-term" ||
                  draggedItemData?.sourceSection === "next-term") ? (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--colour-neutral-500)",
                    }}
                  >
                    No courses planned.
                  </p>
                ) : null}
                {nextTermCoursesToTake.map((c) => (
                  <CatalogCourseCard
                    key={c.id}
                    id={c.id}
                    title={getCourseTitle(c.id)}
                    credits={c.credits || 3}
                    term={c.termPlanned}
                    onRemove={() => removeWishlistCourse(c.id)}
                    accentColor="grey"
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(
                        e,
                        "next-term",
                        c.id,
                        c.termPlanned,
                        c.credits || 3,
                        "grey"
                      )
                    }
                    onDragEnd={handleDragEnd}
                  />
                ))}
                {dragHoverTarget === "next-term" &&
                  draggedItemData &&
                  draggedItemData.sourceSection !== "next-term" && (
                    <CatalogCourseCard
                      id={draggedItemData.id}
                      title={draggedItemData.title}
                      credits={draggedItemData.credits}
                      term={nextTerm}
                      onRemove={() => {}}
                      accentColor="grey"
                      isSkeleton
                    />
                  )}
              </div>
            </div>

            {/* Right Column: Future & Undecided */}
            <div
              className="db-card"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div className="card-header">
                <h2>
                  FUTURE COURSES{" "}
                  <span
                    style={{
                      color: "var(--colour-neutral-500)",
                      fontWeight: "normal",
                    }}
                  >
                    ({creditsRemaining} CR REMAINING)
                  </span>
                </h2>
                <button
                  className="add-btn"
                  onClick={() => {
                    setSelectedCourseTerm("Undecided");
                    setIsWishlistOpen(true);
                  }}
                >
                  Add
                </button>
              </div>

              <div
                className="course-stack"
                onDragOver={(e) => handleDragOver(e, "undecided")}
                onDrop={(e) => handleDrop(e, "undecided")}
                style={{ minHeight: "80px" }}
              >
                {undecidedCoursesToTake.length === 0 &&
                (!dragHoverTarget ||
                  dragHoverTarget !== "undecided" ||
                  draggedItemData?.sourceSection === "undecided") ? (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--colour-neutral-500)",
                    }}
                  >
                    No future courses planned.
                  </p>
                ) : null}
                {undecidedCoursesToTake.map((c) => (
                  <CatalogCourseCard
                    key={c.id}
                    id={c.id}
                    title={getCourseTitle(c.id)}
                    credits={c.credits || 3}
                    term={c.termPlanned || "Undecided"}
                    onRemove={() => removeWishlistCourse(c.id)}
                    accentColor="grey"
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(
                        e,
                        "undecided",
                        c.id,
                        c.termPlanned,
                        c.credits || 3,
                        "grey"
                      )
                    }
                    onDragEnd={handleDragEnd}
                  />
                ))}
                {dragHoverTarget === "undecided" &&
                  draggedItemData &&
                  draggedItemData.sourceSection !== "undecided" && (
                    <CatalogCourseCard
                      id={draggedItemData.id}
                      title={draggedItemData.title}
                      credits={draggedItemData.credits}
                      term={"Undecided"}
                      onRemove={() => {}}
                      accentColor="grey"
                      isSkeleton
                    />
                  )}
              </div>

              <div
                style={{
                  marginTop: "auto",
                  fontSize: "13px",
                  color: "var(--colour-neutral-500)",
                  borderTop: "1px solid var(--colour-neutral-1000)",
                  paddingTop: "16px",
                }}
              >
                {totalCompletedCredits +
                  totalInProgressCredits +
                  coursesToTake.reduce(
                    (sum, c) => sum + (Number(c.credits) || 3),
                    0
                  )}{" "}
                / {targetCredits} cr planned.{" "}
                {Math.max(
                  targetCredits -
                    totalCompletedCredits -
                    totalInProgressCredits -
                    coursesToTake.reduce(
                      (sum, c) => sum + (Number(c.credits) || 3),
                      0
                    ),
                  0
                )}{" "}
                more cr needed.
              </div>
            </div>
          </div>

          {/* Bottom Section: Completed Courses Grid */}
          <div className="db-card">
            <div className="card-header completed-courses-header">
              <h2 className="header-title">
                COMPLETED COURSES{" "}
                <span
                  style={{
                    color: "var(--colour-neutral-500)",
                    fontWeight: "normal",
                  }}
                >
                  ({totalCompletedCredits} CR)
                </span>
              </h2>
              <div className="header-controls">
                <ButtonGroup
                  options={["Term", "A-Z"]}
                  onSelect={(val) => setCompletedSort(val as "Term" | "A-Z")}
                  selectedOption={completedSort}
                />
                <div className="action-buttons">
                  <button
                    className="add-btn"
                    onClick={() => setIsMassAddOpen(true)}
                  >
                    Mass Add
                  </button>
                  <button
                    className="add-btn"
                    onClick={() => {
                      setSelectedCourseTerm(pastTerms[0] || "");
                      setIsAddCompletedOpen(true);
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div
              className="completed-grid"
              onDragOver={(e) => handleDragOver(e, "completed")}
              onDrop={(e) => handleDrop(e, "completed")}
              style={{ minHeight: "100px" }}
            >
              {sortedCompletedCourses.map((c) => (
                <CatalogCourseCard
                  key={`${c.id}-${c.term}`}
                  id={c.id}
                  title={getCourseTitle(c.id)}
                  credits={c.credits}
                  term={c.term}
                  onRemove={() => removeCompletedCourse(c.id, c.term)}
                  accentColor="green"
                  draggable
                  onDragStart={(e) =>
                    handleDragStart(
                      e,
                      "completed",
                      c.id,
                      c.term,
                      Number(c.credits) || 3,
                      "green"
                    )
                  }
                  onDragEnd={handleDragEnd}
                />
              ))}
              {dragHoverTarget === "completed" &&
                draggedItemData &&
                draggedItemData.sourceSection !== "completed" && (
                  <CatalogCourseCard
                    id={draggedItemData.id}
                    title={draggedItemData.title}
                    credits={draggedItemData.credits}
                    term={
                      draggedItemData.term &&
                      draggedItemData.term !== "Undecided"
                        ? draggedItemData.term
                        : currentTerm
                    }
                    onRemove={() => {}}
                    accentColor="green"
                    isSkeleton
                  />
                )}
            </div>

            {completedCourses.length === 0 && (
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--colour-neutral-400)",
                  marginTop: "16px",
                }}
              >
                No completed courses yet.
              </p>
            )}
          </div>
        </div>
      </main>

      <CatalogModal
        isOpen={isAddCompletedOpen}
        onClose={closeModals}
        title="Add Completed Course"
        onSave={handleAddCompleted}
      >
        <CourseCombobox
          value={courseInput}
          onChange={setCourseInput}
          options={outlineOptions}
        />
        <select
          value={selectedCourseTerm}
          onChange={(e) => setSelectedCourseTerm(e.target.value)}
        >
          {pastTerms.map((t: string) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </CatalogModal>

      <CatalogModal
        isOpen={isInProgressOpen}
        onClose={closeModals}
        title={`Add In Progress (${currentTerm})`}
        onSave={handleAddInProgress}
      >
        <CourseCombobox
          value={courseInput}
          onChange={setCourseInput}
          options={currentTermOptions}
        />
      </CatalogModal>

      <CatalogModal
        isOpen={isNextTermOpen}
        onClose={closeModals}
        title={`Add Next Term (${nextTerm})`}
        onSave={handleAddNextTerm}
      >
        <CourseCombobox
          value={courseInput}
          onChange={setCourseInput}
          options={nextTermOptions}
        />
      </CatalogModal>

      <CatalogModal
        isOpen={isWishlistOpen}
        onClose={closeModals}
        title="Add Future Course"
        onSave={handleAddWishlist}
      >
        <CourseCombobox
          value={courseInput}
          onChange={setCourseInput}
          options={futureCourseOptions}
        />
        <select
          value={selectedCourseTerm}
          onChange={(e) => setSelectedCourseTerm(e.target.value)}
        >
          <option value="Undecided">Undecided / I don&apos;t know</option>
          {futureTerms.map((t: string) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </CatalogModal>

      <CatalogModal
        isOpen={isMassAddOpen}
        onClose={closeModals}
        title="Mass Add JSON"
        onSave={handleMassAdd}
      >
        <textarea
          placeholder='[{"course": "CMPT 120", "term": "2022 Summer"}] Tip: Go SFU > Academic Progress > View My Course History > Copy the whole course block into any LLMs ("Convert this to Strict JSON Format Ex: to [{"course": "CMPT 120", "term": "Summer 2025"}]).'
          value={massAddJson}
          onChange={(e) => setMassAddJson(e.target.value)}
          style={{
            width: "100%",
            height: "150px",
            backgroundColor: "var(--colour-neutral-1000)",
            color: "var(--colour-neutral-100)",
            border: "1px solid var(--colour-neutral-800)",
            borderRadius: "8px",
            padding: "10px",
            fontSize: "14px",
            fontFamily: "monospace",
            resize: "vertical",
            marginBottom: "12px",
          }}
        />
      </CatalogModal>
    </div>
  );
};

export default ProgressPage;
