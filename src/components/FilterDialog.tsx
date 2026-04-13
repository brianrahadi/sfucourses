import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Button, ButtonGroup } from "@components";
import { MdTune } from "react-icons/md";
import { SUBJECTS } from "@const";
import Select, { SelectInstance } from "react-select";
import { useScheduleStore } from "src/store/useScheduleStore";

const colourNeutral1000 = "#323434";
const colourNeutral900 = "#4b4e4d";
const colourNeutral800 = "#646867";
const customStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: colourNeutral1000,
    border: 0,
    borderColor: colourNeutral800,
    color: "#fff",
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: colourNeutral1000,
    color: "#fff",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? colourNeutral900 : colourNeutral1000,
    cursor: "pointer",
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: colourNeutral900,
    color: "#fff",
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: "#fff",
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: "#fff",
    ":hover": {
      backgroundColor: colourNeutral800,
      color: "#fff",
    },
  }),
};

export const FilterDialog: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const subjectSelectRef = useRef<SelectInstance<any>>(null);

  const filterConflicts = useScheduleStore((state) => state.filterConflicts);
  const setFilterConflicts = useScheduleStore(
    (state) => state.setFilterConflicts
  );
  const campusFilter = useScheduleStore((state) => state.campusFilter);
  const setCampusFilter = useScheduleStore((state) => state.setCampusFilter);
  const daysFilter = useScheduleStore((state) => state.daysFilter);
  const setDaysFilter = useScheduleStore((state) => state.setDaysFilter);
  const timeFilter = useScheduleStore((state) => state.timeFilter);
  const setTimeFilter = useScheduleStore((state) => state.setTimeFilter);
  const subjectFilter = useScheduleStore((state) => state.subjectFilter);
  const setSubjectFilter = useScheduleStore((state) => state.setSubjectFilter);
  const levelFilter = useScheduleStore((state) => state.levelFilter);
  const setLevelFilter = useScheduleStore((state) => state.setLevelFilter);
  const resetFiltersStore = useScheduleStore((state) => state.clearAllFilters);

  const campusOptions = ["Burnaby", "Surrey", "Vancouver", "Online"];
  const dayOptions = ["Mo", "Tu", "We", "Th", "Fr"];
  const levelOptions = ["1XX", "2XX", "3XX", "4XX", "5XX+"];
  const subjectOptions = SUBJECTS.map((subj) => ({ value: subj, label: subj }));

  const handleCampusToggle = (campus: string) => {
    setCampusFilter(
      campusFilter.includes(campus)
        ? campusFilter.filter((c) => c !== campus)
        : [...campusFilter, campus]
    );
  };

  const handleDayToggle = (day: string) => {
    setDaysFilter(
      daysFilter.includes(day)
        ? daysFilter.filter((d) => d !== day)
        : [...daysFilter, day]
    );
  };

  const handleLevelToggle = (level: string) => {
    setLevelFilter(
      levelFilter.includes(level)
        ? levelFilter.filter((l) => l !== level)
        : [...levelFilter, level]
    );
  };

  const resetAllFilters = () => {
    resetFiltersStore();
    subjectSelectRef.current?.clearValue();
  };

  const hasActiveFilters =
    campusFilter.length > 0 ||
    filterConflicts ||
    daysFilter.length > 0 ||
    timeFilter.start !== "" ||
    timeFilter.end !== "" ||
    subjectFilter.length > 0 ||
    levelFilter.length > 0;

  const router = useRouter();
  const isHydratedRef = useRef(false);

  // Sync state from query on initial load
  useEffect(() => {
    if (router.isReady && !isHydratedRef.current) {
      const q = router.query;

      if (q.filterConflicts === "true") setFilterConflicts(true);
      if (q.campus) setCampusFilter((q.campus as string).split(","));
      if (q.days) setDaysFilter((q.days as string).split(","));
      if (q.subjects) setSubjectFilter((q.subjects as string).split(","));
      if (q.levels) setLevelFilter((q.levels as string).split(","));
      if (q.timeStart || q.timeEnd) {
        setTimeFilter({
          start: (q.timeStart as string) || "",
          end: (q.timeEnd as string) || "",
        });
      }

      isHydratedRef.current = true;
    }
  }, [
    router.isReady,
    router.query,
    setFilterConflicts,
    setCampusFilter,
    setDaysFilter,
    setSubjectFilter,
    setLevelFilter,
    setTimeFilter,
  ]);

  // Sync state to query when state changes
  useEffect(() => {
    if (!router.isReady || !isHydratedRef.current) return;

    const query = { ...router.query };

    const syncArray = (key: string, arr: string[]) => {
      if (arr.length > 0) query[key] = arr.join(",");
      else delete query[key];
    };

    syncArray("campus", campusFilter);
    syncArray("days", daysFilter);
    syncArray("subjects", subjectFilter);
    syncArray("levels", levelFilter);

    if (filterConflicts) query.filterConflicts = "true";
    else delete query.filterConflicts;

    if (timeFilter.start) query.timeStart = timeFilter.start;
    else delete query.timeStart;

    if (timeFilter.end) query.timeEnd = timeFilter.end;
    else delete query.timeEnd;

    const keysToCheck = [
      "filterConflicts",
      "campus",
      "days",
      "subjects",
      "levels",
      "timeStart",
      "timeEnd",
    ];

    let changed = false;
    for (const key of keysToCheck) {
      if (query[key] !== router.query[key]) {
        changed = true;
        break;
      }
    }

    if (changed) {
      router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    }
  }, [
    router,
    router.isReady,
    router.query,
    router.pathname,
    filterConflicts,
    campusFilter,
    daysFilter,
    subjectFilter,
    levelFilter,
    timeFilter,
  ]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowDialog(false);
      }
    };

    if (showDialog) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [showDialog]);

  return (
    <div className="filter-dialog-container">
      <button
        onClick={() => setShowDialog(true)}
        className={`utility-button ${hasActiveFilters ? "active" : ""}`}
        data-filter-button
      >
        <MdTune />
        &nbsp; Filters
        {hasActiveFilters && <span className="filter-count">•</span>}
      </button>

      {showDialog && (
        <div className="schedule-dialog">
          <div className="schedule-dialog-content filter-dialog-content">
            <h3>Course Filters</h3>
            <br />

            {/* Aggregated Filter Indicators */}
            <div className="filter-indicators">
              {subjectFilter.length > 0 && (
                <p className="filter-description">
                  Subjects:{" "}
                  {SUBJECTS.filter((subject) =>
                    subjectFilter.includes(subject)
                  ).join(", ")}
                </p>
              )}
              {levelFilter.length > 0 && (
                <p className="filter-description">
                  Levels:{" "}
                  {levelOptions
                    .filter((level) => levelFilter.includes(level))
                    .join(", ")}
                </p>
              )}
              {campusFilter.length > 0 && (
                <p className="filter-description">
                  Location:{" "}
                  {campusOptions
                    .filter((campus) => campusFilter.includes(campus))
                    .join(", ")}
                </p>
              )}
              {daysFilter.length > 0 && (
                <p className="filter-description">
                  Days:{" "}
                  {dayOptions
                    .filter((day) => daysFilter.includes(day))
                    .join(", ")}
                </p>
              )}
              {(timeFilter.start !== "" || timeFilter.end !== "") && (
                <p className="filter-description">
                  Time:{" "}
                  {timeFilter.start !== "" && timeFilter.end !== ""
                    ? `${timeFilter.start} - ${timeFilter.end}`
                    : timeFilter.start !== ""
                    ? `${timeFilter.start}+`
                    : `-${timeFilter.end}`}
                </p>
              )}
            </div>
            {/* Conflict Filter */}
            <div className="filter-section">
              <ButtonGroup
                options={["All courses", "Conflict-free"]}
                selectedOption={
                  filterConflicts ? "Conflict-free" : "All courses"
                }
                onSelect={(value) =>
                  setFilterConflicts(value === "Conflict-free")
                }
              />
            </div>
            {/* Subject Filter */}
            <div className="filter-section">
              <Select
                ref={subjectSelectRef}
                className="filter-subject-select"
                options={subjectOptions}
                isMulti={true}
                closeMenuOnSelect={false}
                styles={customStyles}
                value={subjectOptions.filter(
                  (option: { value: string; label: string }) =>
                    subjectFilter.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  const selectedSubjects = selectedOptions
                    ? selectedOptions.map(
                        (option: { value: string; label: string }) =>
                          option.value
                      )
                    : [];
                  setSubjectFilter(selectedSubjects);
                }}
                placeholder="Select subjects..."
              />
            </div>

            {/* Level Filter */}
            <div className="filter-section">
              <div className="level-filter">
                {levelOptions.map((level) => (
                  <button
                    key={level}
                    onClick={() => handleLevelToggle(level)}
                    className={`level-button ${
                      levelFilter.includes(level) ? "selected" : ""
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div className="filter-section">
              <div className="campus-filter">
                {campusOptions.map((campus) => (
                  <button
                    key={campus}
                    onClick={() => handleCampusToggle(campus)}
                    className={`campus-button ${
                      campusFilter.includes(campus) ? "selected" : ""
                    }`}
                  >
                    {campus}
                  </button>
                ))}
              </div>
            </div>

            {/* Days Filter */}
            <div className="filter-section">
              <div className="days-filter">
                {dayOptions.map((day) => (
                  <button
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`day-button ${
                      daysFilter.includes(day) ? "selected" : ""
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Filter */}
            <div className="filter-section">
              <div className="time-filter">
                <div className="time-input-group">
                  {/* <label>Start Hour:</label> */}
                  <input
                    type="text"
                    value={timeFilter.start}
                    onChange={(e) =>
                      setTimeFilter({
                        ...timeFilter,
                        start: e.target.value,
                      })
                    }
                    placeholder="8:00"
                  />
                </div>
                <div className="time-input-group">
                  {/* <label>End Hour:</label> */}
                  <input
                    type="text"
                    value={timeFilter.end}
                    onChange={(e) =>
                      setTimeFilter({
                        ...timeFilter,
                        end: e.target.value,
                      })
                    }
                    placeholder="17:00"
                  />
                </div>
              </div>
            </div>

            <div className="schedule-dialog-buttons">
              <Button
                label="Reset All"
                onClick={resetAllFilters}
                type="secondary"
                disabled={!hasActiveFilters}
              />
              <Button
                label="Close"
                onClick={() => setShowDialog(false)}
                type="primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDialog;
