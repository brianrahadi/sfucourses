import React, { useState, useEffect, useRef } from "react";
import { CourseWithSectionDetails, TimeBlock } from "@types";
import { Button } from "./Button";
import { FaSave, FaFolderOpen } from "react-icons/fa";
import { IoMdStar, IoMdStarOutline } from "react-icons/io";
import toast from "react-hot-toast";
import { useScheduleStore } from "src/store/useScheduleStore";

interface ScheduleManagerProps {
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
  selectedTerm,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const previousTermRef = useRef(selectedTerm);

  const coursesWithSections = useScheduleStore(
    (state) => state.selectedOutlinesWithSections
  );
  const setCoursesWithSections = useScheduleStore(
    (state) => state.setSelectedOutlinesWithSections
  );
  const timeBlocks = useScheduleStore((state) => state.timeBlocks);
  const setTimeBlocks = useScheduleStore((state) => state.setTimeBlocks);

  useEffect(() => {
    const loadedSchedules = localStorage.getItem("savedSchedules");
    if (loadedSchedules) {
      try {
        const parsedSchedules = JSON.parse(loadedSchedules);
        const updatedSchedules = parsedSchedules.map((schedule: any) => ({
          ...schedule,
          timeBlocks: schedule.timeBlocks || [],
        }));
        setSavedSchedules(updatedSchedules);
      } catch (error) {
        console.error("Error parsing saved schedules:", error);
        setSavedSchedules([]);
      }
    }
  }, []);

  useEffect(() => {
    if (
      previousTermRef.current !== selectedTerm &&
      (coursesWithSections.length === 0 ||
        !coursesWithSections.some((course) => course.term === selectedTerm))
    ) {
      loadDefaultScheduleForTerm(selectedTerm);
      previousTermRef.current = selectedTerm;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerm, coursesWithSections, savedSchedules]);

  useEffect(() => {
    if (savedSchedules.length > 0) {
      localStorage.setItem("savedSchedules", JSON.stringify(savedSchedules));
    }
  }, [savedSchedules]);

  const loadDefaultScheduleForTerm = (term: string) => {
    const defaultSchedule = savedSchedules.find(
      (schedule) => schedule.isDefault && schedule.term === term
    );

    if (defaultSchedule) {
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

    const currentTermSchedules = savedSchedules.filter(
      (s) => s.term === selectedTerm
    );

    const newSchedule: SavedSchedule = {
      id: Date.now(),
      name: scheduleName,
      courses: coursesWithSections,
      timeBlocks: timeBlocks,
      term: selectedTerm,
      isDefault: currentTermSchedules.length === 0,
      timestamp: Date.now(),
    };

    const existingIndex = savedSchedules.findIndex(
      (s) => s.term === selectedTerm && s.name === scheduleName
    );

    if (existingIndex !== -1) {
      const updatedSchedules = [...savedSchedules];
      updatedSchedules[existingIndex] = {
        ...newSchedule,
        isDefault: updatedSchedules[existingIndex].isDefault,
      };
      setSavedSchedules(updatedSchedules);
      toast.success(`Schedule "${scheduleName}" updated`);
    } else {
      setSavedSchedules([...savedSchedules, newSchedule]);
      toast.success(`Schedule "${scheduleName}" saved`);
    }

    setShowSaveDialog(false);
    setScheduleName("");
  };

  const handleLoadSchedule = (schedule: SavedSchedule) => {
    setCoursesWithSections(schedule.courses);
    setTimeBlocks(schedule.timeBlocks || []);
    setShowLoadDialog(false);
    toast.success(`Schedule "${schedule.name}" loaded`);
  };

  const handleDeleteSchedule = (id: number) => {
    const scheduleToDelete = savedSchedules.find((s) => s.id === id);
    const updatedSchedules = savedSchedules.filter((s) => s.id !== id);

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
      isDefault:
        schedule.term === scheduleToSetDefault.term
          ? schedule.id === id
          : schedule.isDefault,
    }));

    setSavedSchedules(updatedSchedules);
    toast.success("Default schedule set");
  };

  const filteredSchedules = savedSchedules.filter(
    (s) => s.term === selectedTerm
  );

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
      <div className="schedule-manager-buttons">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="utility-button"
          disabled={coursesWithSections.length === 0}
        >
          <FaSave />
          <span className="hide-on-mobile">&nbsp; Save</span>
        </button>
        <button
          onClick={() => setShowLoadDialog(true)}
          className="utility-button"
          disabled={filteredSchedules.length === 0}
        >
          <FaFolderOpen />
          <span className="hide-on-mobile">&nbsp; Load</span>
        </button>
      </div>

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
