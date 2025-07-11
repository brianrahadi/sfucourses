import React, { useState, useEffect, useRef } from "react";
import { CourseWithSectionDetails, TimeBlock } from "@types";
import { Button } from "./Button";
import { FaSave, FaFolderOpen } from "react-icons/fa";
import { IoMdStar, IoMdStarOutline } from "react-icons/io";
import toast from "react-hot-toast";
import { SectionDetails, WeeklySchedule } from "@components";

interface ScheduleManagerProps {
  coursesWithSections: CourseWithSectionDetails[];
  setCoursesWithSections: React.Dispatch<
    React.SetStateAction<CourseWithSectionDetails[]>
  >;
  timeBlocks: TimeBlock[];
  setTimeBlocks: React.Dispatch<React.SetStateAction<TimeBlock[]>>;
  selectedTerm: string;
}

interface SavedSchedule {
  id: number;
  name: string;
  courses: CourseWithSectionDetails[];
  timeBlocks: TimeBlock[];
  term: string;
  isDefault: boolean;
  timestamp: number;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  coursesWithSections,
  setCoursesWithSections,
  timeBlocks,
  setTimeBlocks,
  selectedTerm,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const previousTermRef = useRef(selectedTerm);

  useEffect(() => {
    const loadedSchedules = localStorage.getItem("savedSchedules");
    if (loadedSchedules) {
      try {
        const parsedSchedules = JSON.parse(loadedSchedules);
        const updatedSchedules = parsedSchedules.map((schedule: any) => ({
          ...schedule,
          timeBlocks: schedule.timeBlocks || [], // Add empty timeBlocks array if it doesn't exist
        }));
        setSavedSchedules(updatedSchedules);
      } catch (error) {
        console.error("Error parsing saved schedules:", error);
        setSavedSchedules([]);
      }
    }
  }, []);

  useEffect(() => {
    // Only load default schedule if the term has changed and coursesWithSections is not for the new term
    if (
      previousTermRef.current !== selectedTerm &&
      (coursesWithSections.length === 0 ||
        !coursesWithSections.some((course) => course.term === selectedTerm))
    ) {
      console.log("loadDefaultScheduleForTerm", savedSchedules);
      loadDefaultScheduleForTerm(selectedTerm);
      previousTermRef.current = selectedTerm;
    }
  }, [selectedTerm, coursesWithSections, savedSchedules]);

  // Save schedules to localStorage when they change
  useEffect(() => {
    if (savedSchedules.length > 0) {
      localStorage.setItem("savedSchedules", JSON.stringify(savedSchedules));
    }
  }, [savedSchedules]);

  // Function to load the default schedule for a specific term
  const loadDefaultScheduleForTerm = (term: string) => {
    const defaultSchedule = savedSchedules.find(
      (schedule) => schedule.isDefault && schedule.term === term
    );

    if (defaultSchedule) {
      // tried without setTimeout but didn't work, RIP CLEAN CODE
      setTimeout(() => {
        setCoursesWithSections(defaultSchedule.courses);
        setTimeBlocks(defaultSchedule.timeBlocks || []);
        toast.success(
          `Default schedule "${defaultSchedule.name}" loaded for ${term}`
        );
      }, 10);
    }
  };

  const handleSaveSchedule = () => {
    if (coursesWithSections.length === 0 && timeBlocks.length === 0) {
      toast.error("No courses or time blocks selected to save");
      return;
    }

    if (!scheduleName.trim()) {
      toast.error("Please enter a schedule name");
      return;
    }

    // Filter schedules by current term to check limit
    const currentTermSchedules = savedSchedules.filter(
      (s) => s.term === selectedTerm
    );

    const newSchedule: SavedSchedule = {
      id: Date.now(),
      name: scheduleName,
      courses: coursesWithSections,
      timeBlocks: timeBlocks, // Save time blocks with the schedule
      term: selectedTerm,
      isDefault: currentTermSchedules.length === 0, // First saved schedule for a term becomes default
      timestamp: Date.now(),
    };

    // Check if a schedule with the same name already exists for this term
    const existingIndex = savedSchedules.findIndex(
      (s) => s.term === selectedTerm && s.name === scheduleName
    );

    if (existingIndex !== -1) {
      // Update existing schedule
      const updatedSchedules = [...savedSchedules];
      updatedSchedules[existingIndex] = {
        ...newSchedule,
        isDefault: updatedSchedules[existingIndex].isDefault, // Preserve default status
      };
      setSavedSchedules(updatedSchedules);
      toast.success(`Schedule "${scheduleName}" updated`);
    } else {
      // Add new schedule
      setSavedSchedules([...savedSchedules, newSchedule]);
      toast.success(`Schedule "${scheduleName}" saved`);
    }

    setShowSaveDialog(false);
    setScheduleName("");
  };

  const handleLoadSchedule = (schedule: SavedSchedule) => {
    setCoursesWithSections(schedule.courses);
    // Also load the time blocks
    setTimeBlocks(schedule.timeBlocks || []);
    setShowLoadDialog(false);
    toast.success(`Schedule "${schedule.name}" loaded`);
  };

  const handleDeleteSchedule = (id: number) => {
    const scheduleToDelete = savedSchedules.find((s) => s.id === id);
    const updatedSchedules = savedSchedules.filter((s) => s.id !== id);

    // If we're deleting the default schedule, make the most recent one for that term the default
    if (scheduleToDelete?.isDefault && updatedSchedules.length > 0) {
      const termSchedules = updatedSchedules.filter(
        (s) => s.term === scheduleToDelete.term
      );

      if (termSchedules.length > 0) {
        const mostRecent = termSchedules.reduce((prev, current) =>
          prev.timestamp > current.timestamp ? prev : current
        );
        const mostRecentIndex = updatedSchedules.findIndex(
          (s) => s.id === mostRecent.id
        );
        updatedSchedules[mostRecentIndex].isDefault = true;
      }
    }

    setSavedSchedules(updatedSchedules);
    toast.success("Schedule deleted");
  };

  const handleSetDefault = (id: number) => {
    const scheduleToSetDefault = savedSchedules.find((s) => s.id === id);
    if (!scheduleToSetDefault) return;

    const updatedSchedules = savedSchedules.map((schedule) => ({
      ...schedule,
      // Only update default status for schedules in the same term
      isDefault:
        schedule.term === scheduleToSetDefault.term
          ? schedule.id === id
          : schedule.isDefault,
    }));

    setSavedSchedules(updatedSchedules);
    toast.success("Default schedule set");
  };

  // Filter schedules by the currently selected term
  const filteredSchedules = savedSchedules.filter(
    (s) => s.term === selectedTerm
  );

  // Get a summary of the schedule contents
  const getScheduleSummary = (schedule: SavedSchedule) => {
    const courseCount = schedule.courses.length;
    const blockCount = schedule.timeBlocks?.length || 0;

    let summary = "";
    if (courseCount > 0) {
      summary += `${courseCount} course${courseCount !== 1 ? "s" : ""}`;
    }

    if (blockCount > 0) {
      if (summary) summary += ", ";
      summary += `${blockCount} time block${blockCount !== 1 ? "s" : ""}`;
    }

    return summary || "Empty schedule";
  };

  return (
    <div className="schedule-manager">
      {/* Weekly Schedule with preview support */}
      {/* <WeeklySchedule
        coursesWithSections={coursesWithSections}
        setCoursesWithSections={setCoursesWithSections}
        timeBlocks={timeBlocks}
        setTimeBlocks={setTimeBlocks}
        previewCourse={previewCourse}
      /> */}
      {/* Section details for each selected course */}
      {/* <div className="selected-courses-section-details">
        {coursesWithSections.map((course) => (
          <SectionDetails
            key={course.dept + course.number}
            offering={course}
            setOfferings={{ fn: setCoursesWithSections, type: "REMOVE" }}
            type="SELECTED_COURSES"
            onPreviewStart={setPreviewCourse}
            onPreviewEnd={() => setPreviewCourse(null)}
          />
        ))}
      </div> */}
      <div className="schedule-manager-buttons">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="utility-button"
          disabled={coursesWithSections.length === 0}
        >
          <FaSave />
          &nbsp; Save
        </button>
        <button
          onClick={() => setShowLoadDialog(true)}
          className="utility-button"
          disabled={filteredSchedules.length === 0}
        >
          <FaFolderOpen />
          &nbsp; Load
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="schedule-dialog">
          <div className="schedule-dialog-content">
            <h3>Save Schedule</h3>
            <input
              type="text"
              placeholder="Schedule name"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              maxLength={20}
            />
            <div className="schedule-summary">
              Saving:{" "}
              {coursesWithSections.length > 0 && (
                <span>
                  {coursesWithSections.length} course
                  {coursesWithSections.length !== 1 ? "s" : ""}
                </span>
              )}
              {timeBlocks.length > 0 && (
                <span>
                  {coursesWithSections.length > 0 ? ", " : ""}
                  {timeBlocks.length} time block
                  {timeBlocks.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="schedule-dialog-buttons">
              <Button
                label="Cancel"
                onClick={() => {
                  setShowSaveDialog(false);
                  setScheduleName("");
                }}
                type="secondary"
              />
              <Button
                label="Save"
                onClick={handleSaveSchedule}
                type="primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="schedule-dialog">
          <div className="schedule-dialog-content">
            <h3>Load Schedule</h3>
            {filteredSchedules.length > 0 ? (
              <div className="saved-schedules-list">
                {filteredSchedules.map((schedule) => (
                  <div key={schedule.id} className="saved-schedule-item">
                    <div className="saved-schedule-info">
                      <button
                        className="star-button"
                        onClick={() => handleSetDefault(schedule.id)}
                        title={
                          schedule.isDefault
                            ? "Default schedule"
                            : "Set as default"
                        }
                      >
                        {schedule.isDefault ? (
                          <IoMdStar className="star-icon filled" />
                        ) : (
                          <IoMdStarOutline className="star-icon" />
                        )}
                      </button>
                      <span className="schedule-name">{schedule.name}</span>
                      <span className="schedule-contents">
                        {getScheduleSummary(schedule)}
                      </span>
                    </div>
                    <div className="saved-schedule-actions">
                      <Button
                        label="Load"
                        onClick={() => handleLoadSchedule(schedule)}
                        type="primary"
                        className="small-btn"
                      />
                      <Button
                        label="Delete"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        type="secondary"
                        className="small-btn"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-schedules">No saved schedules for this term</p>
            )}
            <div className="schedule-dialog-buttons">
              <Button
                label="Close"
                onClick={() => setShowLoadDialog(false)}
                type="secondary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;
