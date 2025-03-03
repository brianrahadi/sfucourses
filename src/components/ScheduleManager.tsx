import React, { useState, useEffect } from "react";
import { CourseWithSectionDetails } from "@types";
import { Button } from "./Button";
import { FaSave, FaFolderOpen } from "react-icons/fa";
import { IoMdStar, IoMdStarOutline } from "react-icons/io";
import toast from "react-hot-toast";

interface ScheduleManagerProps {
  coursesWithSections: CourseWithSectionDetails[];
  setCoursesWithSections: React.Dispatch<
    React.SetStateAction<CourseWithSectionDetails[]>
  >;
  selectedTerm: string;
}

interface SavedSchedule {
  id: number;
  name: string;
  courses: CourseWithSectionDetails[];
  term: string;
  isDefault: boolean;
  timestamp: number;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  coursesWithSections,
  setCoursesWithSections,
  selectedTerm,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);

  // Load saved schedules from localStorage on component mount
  useEffect(() => {
    const loadedSchedules = localStorage.getItem("savedSchedules");
    if (loadedSchedules) {
      setSavedSchedules(JSON.parse(loadedSchedules));
    }
  }, []);

  // Load default schedule if it exists
  useEffect(() => {
    const loadedSchedules = localStorage.getItem("savedSchedules");
    if (loadedSchedules) {
      const schedules: SavedSchedule[] = JSON.parse(loadedSchedules);
      const defaultSchedule = schedules.find(
        (schedule) => schedule.isDefault && schedule.term === selectedTerm
      );

      if (defaultSchedule && coursesWithSections.length === 0) {
        setCoursesWithSections(defaultSchedule.courses);
        toast.success(`Default schedule "${defaultSchedule.name}" loaded`);
      }
    }
  }, [selectedTerm, setCoursesWithSections]);

  // Save schedules to localStorage when they change
  useEffect(() => {
    if (savedSchedules.length > 0) {
      localStorage.setItem("savedSchedules", JSON.stringify(savedSchedules));
    }
  }, [savedSchedules]);

  const handleSaveSchedule = () => {
    if (coursesWithSections.length === 0) {
      toast.error("No courses selected to save");
      return;
    }

    if (!scheduleName.trim()) {
      toast.error("Please enter a schedule name");
      return;
    }

    const newSchedule: SavedSchedule = {
      id: Date.now(),
      name: scheduleName,
      courses: coursesWithSections,
      term: selectedTerm,
      isDefault: savedSchedules.length === 0, // First saved schedule becomes default
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
    setShowLoadDialog(false);
    toast.success(`Schedule "${schedule.name}" loaded`);
  };

  const handleDeleteSchedule = (id: number) => {
    const updatedSchedules = savedSchedules.filter((s) => s.id !== id);

    // If we're deleting the default schedule, make the most recent one the default
    if (
      savedSchedules.find((s) => s.id === id)?.isDefault &&
      updatedSchedules.length > 0
    ) {
      const mostRecent = updatedSchedules.reduce((prev, current) =>
        prev.timestamp > current.timestamp ? prev : current
      );
      mostRecent.isDefault = true;
    }

    setSavedSchedules(updatedSchedules);
    toast.success("Schedule deleted");
  };

  const handleSetDefault = (id: number) => {
    const updatedSchedules = savedSchedules.map((schedule) => ({
      ...schedule,
      isDefault: schedule.id === id,
    }));

    setSavedSchedules(updatedSchedules);
    toast.success("Default schedule set");
  };

  // Filter schedules by the currently selected term
  const filteredSchedules = savedSchedules.filter(
    (s) => s.term === selectedTerm
  );

  return (
    <div className="schedule-manager">
      <div className="schedule-manager-buttons">
        <Button
          label="Save"
          icon={<FaSave />}
          onClick={() => setShowSaveDialog(true)}
          type="primary"
          className="schedule-btn"
        />
        <Button
          label="Load"
          icon={<FaFolderOpen />}
          onClick={() => setShowLoadDialog(true)}
          type="primary"
          className="schedule-btn"
          disabled={filteredSchedules.length === 0}
        />
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
                      <span className="course-count">
                        {schedule.courses.length} course
                        {schedule.courses.length !== 1 ? "s" : ""}
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
