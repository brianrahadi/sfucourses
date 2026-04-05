import { useState, useMemo, useEffect } from "react";
import {
  Hero,
  CatalogModal,
  CourseCombobox,
  CatalogCourseCard,
} from "@components";
import ButtonGroup from "../components/ButtonGroup";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useCatalogStore } from "src/store/useCatalogStore";
import { useCoursesData } from "src/hooks/UseCoursesData";
import { getCurrentAndNextTerm } from "@utils";
import toast from "react-hot-toast";
import { OutlineOption } from "src/components/CourseCombobox";

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

  const progressPercentage = Math.min((totalCompletedCredits / 120) * 100, 100);
  const creditsRemaining = Math.max(
    120 - totalCompletedCredits - totalInProgressCredits,
    0
  );

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

      if (sourceSection === "completed") {
        removeCompletedCourse(courseId, courseTerm);
      } else {
        removeWishlistCourse(courseId);
      }

      if (targetSection === "completed") {
        addCompletedCourse({
          id: courseId,
          term:
            courseTerm && courseTerm !== "Undecided" ? courseTerm : currentTerm,
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

    addCompletedCourse({
      id: courseInput.trim().toUpperCase(),
      term:
        selectedCourseTerm === "Undecided" ? currentTerm : selectedCourseTerm,
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

  return (
    <div className="page progress-page">
      <Hero title="Progress" backgroundImage={HeroImage.src} />
      <main className="container">
        <div className="catalog-dashboard">
          <div className="db-header">
            <div className="db-user-info">
              {/* <h1>You</h1> */}
              {/* <p>BSc Computer Science · Student ID: 20210482 · Year 3</p> */}
            </div>
          </div>

          <div className="db-progress-section">
            <div className="progress-header">
              <span>Overall degree progress</span>
              <span className="progress-text">
                {totalCompletedCredits} / 120 credits (
                {Math.round(progressPercentage)}%)
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
                  + Add course
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

            {/* Right Column: Courses To Take */}
            <div className="db-card">
              <div className="card-header">
                <h2>
                  COURSES TO TAKE{" "}
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
                    setSelectedCourseTerm(nextTerm);
                    setIsWishlistOpen(true);
                  }}
                >
                  + Add course
                </button>
              </div>

              <h3
                style={{
                  fontSize: "14px",
                  color: "var(--colour-neutral-300)",
                  marginBottom: "16px",
                  marginTop: "4px",
                }}
              >
                Next Term ({nextTerm})
              </h3>
              <div
                className="course-list-grid"
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

              <h3
                style={{
                  fontSize: "14px",
                  color: "var(--colour-neutral-300)",
                  marginBottom: "16px",
                  marginTop: "32px",
                }}
              >
                Future & Undecided
              </h3>
              <div
                className="course-list-grid"
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
                  marginTop: "32px",
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
                / 120 cr planned.{" "}
                {Math.max(
                  120 -
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
            <div
              className="card-header"
              style={{ flexWrap: "wrap", gap: "16px" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <h2>
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
                <ButtonGroup
                  options={["Term", "A-Z"]}
                  onSelect={(val) => setCompletedSort(val as "Term" | "A-Z")}
                  selectedOption={completedSort}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="add-btn"
                  onClick={() => setIsMassAddOpen(true)}
                >
                  + Mass Add
                </button>
                <button
                  className="add-btn"
                  onClick={() => setIsAddCompletedOpen(true)}
                >
                  + Add course
                </button>
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
          {chronologicalTerms.map((t: string) => (
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
          options={outlineOptions}
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
          options={outlineOptions}
        />
        <select
          value={selectedCourseTerm}
          onChange={(e) => setSelectedCourseTerm(e.target.value)}
        >
          <option value="Undecided">Undecided / I don't know</option>
          {chronologicalTerms.map((t: string) => (
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
          placeholder='[{"course": "CMPT 120", "term": "2022 Summer"}] Tip: Go SFU > Academic Progress > View My Course History > Copy the whole course block into any LLMs.'
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
