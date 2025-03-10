import { CourseWithSectionDetails, TimeBlock } from "@types";
import { formatTime, getDarkColorFromHash } from "@utils/format";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useRef,
} from "react";
import { format, addDays, startOfWeek } from "date-fns";
import toast from "react-hot-toast";
import Button from "./Button";
import { mergeOverlappingBlocks } from "@utils/timeBlocks";
import { isMobile } from "@utils/deviceDetection";

interface Course {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  day: string;
}

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const startHour = 8; // Start at 8:00 AM
const endHour = 20; // End at 8:00 PM

interface WeeklyScheduleProps {
  coursesWithSections: CourseWithSectionDetails[];
  setCoursesWithSections: Dispatch<SetStateAction<CourseWithSectionDetails[]>>;
  timeBlocks?: TimeBlock[]; // Make optional
  setTimeBlocks?: Dispatch<SetStateAction<TimeBlock[]>>; // Make optional
}

const convertTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const calculateDuration = (startTime: string, endTime: string): number => {
  const start = convertTimeToMinutes(startTime);
  const end = convertTimeToMinutes(endTime);
  return end - start;
};

const getDayFromCode = (dayCode: string): string[] => {
  const dayMap: { [key: string]: string } = {
    Mo: "Mon",
    Tu: "Tue",
    We: "Wed",
    Th: "Thu",
    Fr: "Fri",
  };
  const days = dayCode.split(", ").map((code) => dayMap[code]);
  return days || dayCode;
};

interface ConflictResponse {
  hasConflict: boolean;
  conflictMessage?: string;
}

const doTimeslotsConflict = (ts1: Course, ts2: Course): ConflictResponse => {
  if (ts1.day !== ts2.day) return { hasConflict: false }; // Different days, no conflict
  const ts1End = ts1.startTime + ts1.duration;
  const ts2End = ts2.startTime + ts2.duration;

  const hasConflict =
    (ts1.startTime >= ts2.startTime && ts1.startTime < ts2End) ||
    (ts2.startTime >= ts1.startTime && ts2.startTime < ts1End);

  if (hasConflict) {
    return {
      hasConflict: true,
      conflictMessage: `${ts2.id}`,
    };
  }
  return { hasConflict: false };
};

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  coursesWithSections,
  setCoursesWithSections,
  timeBlocks = [], // Default to empty array
  setTimeBlocks,
}) => {
  const [timeslots, setTimeslots] = useState<Course[]>([]);
  const [weekStartDate, setWeekStartDate] = useState<Date | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(1);
  const [initialWeekDate, setInitialWeekDate] = useState<Date | null>(null);
  const [slotHeight, setSlotHeight] = useState(20); // Default slot height
  const scheduleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Time blocking state
  const [isInTimeBlockMode, setIsInTimeBlockMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectionStartDay, setSelectionStartDay] = useState<string | null>(
    null
  );
  const [selectionStartTime, setSelectionStartTime] = useState<number | null>(
    null
  );
  const [selectionEndDay, setSelectionEndDay] = useState<string | null>(null);
  const [selectionEndTime, setSelectionEndTime] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<TimeBlock | null>(null);

  // Mobile-specific state
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [touchStartSlot, setTouchStartSlot] = useState<{
    day: string;
    time: number;
  } | null>(null);
  const [showMobileHelp, setShowMobileHelp] = useState(false);
  const originalBodyOverflow = useRef("");

  // Effect to handle responsive slot height
  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight <= 700) {
        setSlotHeight(15);
      } else if (window.innerHeight <= 800) {
        setSlotHeight(18);
      } else {
        setSlotHeight(20);
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Detect mobile devices on component mount
  useEffect(() => {
    const isMobileDevice = isMobile();
    setIsTouchDevice(isMobileDevice);

    // On desktop, time block creation is enabled by default
    // On mobile, we start with it disabled and let user toggle it
    setIsInTimeBlockMode(!isMobileDevice);

    // Show mobile help if it's a touch device and first visit
    if (isMobileDevice && setTimeBlocks) {
      const hasSeenMobileHelp = localStorage.getItem("seenTimeBlockMobileHelp");
      if (!hasSeenMobileHelp) {
        setShowMobileHelp(true);
      }
    }
  }, [setTimeBlocks]);

  // Function to calculate visible timeslots for a specific week
  const calculateTimeslotsForWeek = (weekDate: Date) => {
    const newTimeslots: Course[] = [];
    const allConflictMessages: string[] = [];

    // First process course sections
    coursesWithSections.forEach((course) => {
      course.sections.forEach((section) => {
        section.schedules.forEach((schedule) => {
          if (!schedule.startTime || !schedule.endTime || !schedule.days) {
            return;
          }

          // Skip if the course doesn't fall within this week
          if (schedule.startDate && schedule.endDate) {
            const scheduleStart = new Date(schedule.startDate);
            const scheduleEnd = new Date(schedule.endDate);
            const weekEnd = addDays(weekDate, 6); // Sunday of selected week

            // If the schedule doesn't overlap with the current week, skip it
            if (scheduleEnd < weekDate || scheduleStart > weekEnd) {
              return;
            }
          }

          const days = getDayFromCode(schedule.days);
          const startTime = convertTimeToMinutes(schedule.startTime);
          const duration = calculateDuration(
            schedule.startTime,
            schedule.endTime
          );

          days.forEach((day) => {
            const id = `${course.dept}${course.number}-${section.section}-${day}-${schedule.sectionCode}`;

            const newTimeslot = {
              id,
              name: `${course.dept} ${course.number} \n${section.section}\n${
                section.schedules[0]?.campus || ""
              }`,
              startTime,
              duration,
              day,
            };

            // Check for conflicts with existing timeslots
            const conflicts = newTimeslots
              .map((existingTimeslot) =>
                doTimeslotsConflict(newTimeslot, existingTimeslot)
              )
              .filter((result) => result.hasConflict);

            if (conflicts.length > 0) {
              conflicts.forEach((conflict) => {
                allConflictMessages.push(conflict.conflictMessage || "");
              });
            } else {
              newTimeslots.push(newTimeslot);
            }
          });
        });
      });
    });

    // Next, process time blocks
    if (timeBlocks && timeBlocks.length > 0) {
      timeBlocks.forEach((block) => {
        const newTimeslot = {
          id: block.id,
          name: block.label,
          startTime: block.startTime,
          duration: block.duration,
          day: block.day,
        };

        // No conflict check needed for time blocks, they're manually created
        newTimeslots.push(newTimeslot);
      });
    }

    return { newTimeslots, allConflictMessages };
  };

  // Initialize the schedule with the earliest week
  useEffect(() => {
    let earliestStartDate: Date | null = null;

    // Find the earliest start date among all courses
    coursesWithSections.forEach((course) => {
      course.sections.forEach((section) => {
        section.schedules.forEach((schedule) => {
          if (schedule.startDate) {
            const currentDate = new Date(schedule.startDate);
            if (!earliestStartDate || currentDate < earliestStartDate) {
              earliestStartDate = currentDate;
            }
          }
        });
      });
    });

    // Set the initial week start date
    if (earliestStartDate) {
      // Find the Monday of the week containing the earliest start date
      const weekStart = startOfWeek(earliestStartDate, { weekStartsOn: 1 }); // 1 = Monday
      setInitialWeekDate(weekStart);
    } else {
      // If no start dates are available, use the current week
      setInitialWeekDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    }

    // Reset week offset when courses change
    setCurrentWeekOffset(1);
  }, [coursesWithSections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset body overflow to its original state when component unmounts
      document.body.style.overflow = originalBodyOverflow.current;
    };
  }, []);

  useEffect(() => {
    if (!initialWeekDate) return;

    const currentWeekDate = addDays(initialWeekDate, currentWeekOffset * 7);
    setWeekStartDate(currentWeekDate);
    const { newTimeslots, allConflictMessages } =
      calculateTimeslotsForWeek(currentWeekDate);

    if (allConflictMessages.length > 0) {
      const combinedConflictMessage = allConflictMessages.join("\n");
      setCoursesWithSections((prev) => {
        const newArray = prev.slice(0, -1);
        return newArray;
      });
      toast.error(`Conflicts detected:\n${combinedConflictMessage}`, {
        duration: 4000,
        position: "top-center",
        style: {},
        className: "",
        icon: "🚨",
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
        removeDelay: 1000,
      });
    }

    setTimeslots(newTimeslots);
  }, [
    initialWeekDate,
    currentWeekOffset,
    coursesWithSections,
    setCoursesWithSections,
    timeBlocks, // Re-calculate when time blocks change
  ]);

  // Clear selection when exiting time block mode
  useEffect(() => {
    if (!isInTimeBlockMode) {
      clearSelection();
    }
  }, [isInTimeBlockMode]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekOffset((prev) => prev - 1);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeekOffset((prev) => prev + 1);
  };

  // Reset to initial week
  const resetToInitialWeek = () => {
    setCurrentWeekOffset(1);
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push({ hour, minute: 0 }, { hour, minute: 30 });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Helper function to calculate position and size for course slots
  const calculateCoursePosition = (course: Course) => {
    // Calculate top position based on start time
    const minutesSinceStartHour = course.startTime - startHour * 60;
    // Each hour is represented by 2 time slots (one for each 30 min)
    const hourHeight = slotHeight * 2;
    const topOffset = (minutesSinceStartHour / 60) * hourHeight;

    // Calculate height based on duration
    const height = (course.duration / 60) * hourHeight;

    return { topOffset, height };
  };

  // Function to handle time slot click
  const handleTimeSlotClick = (day: string, time: number) => {
    if ((!isInTimeBlockMode && !isTouchDevice) || !setTimeBlocks) return;

    const slotKey = `${day}-${time}`;

    // If this is the first slot selected, set it as the start
    if (!selectionStartDay) {
      setSelectionStartDay(day);
      setSelectionStartTime(time);

      // Initialize preview
      setDragPreview({
        id: `preview-${Math.random().toString(36).substring(2, 11)}`,
        day,
        startTime: time,
        duration: 30, // Default to 30 minutes duration
        label: "Blocked",
      });

      // Mark this slot as selected
      setSelectedSlots({ [slotKey]: true });
      return;
    }

    // If we already have a start, complete the selection
    if (selectionStartDay) {
      // If clicking on a different day, ignore (only allow same-day blocks)
      if (day !== selectionStartDay) {
        clearSelection();
        return;
      }

      // Create the time block
      const startTime = Math.min(selectionStartTime || 0, time);
      const endTime = Math.max(selectionStartTime || 0, time);
      const duration = endTime - startTime + 30; // Include the end slot

      // Don't create blocks less than 15 minutes
      if (duration < 15) {
        clearSelection();
        return;
      }

      const newBlock = {
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        day,
        startTime,
        duration,
        label: "Blocked",
      };

      // Add the block and merge any overlapping blocks
      setTimeBlocks((prev) => {
        // First add the new block
        const updatedBlocks = [...prev, newBlock];

        // Then merge any overlapping blocks
        const mergedBlocks = mergeOverlappingBlocks(updatedBlocks);

        // If blocks were merged, show a different message
        if (mergedBlocks.length < updatedBlocks.length) {
          setTimeout(() => {
            toast.success("Overlapping time blocks have been merged!");
          }, 100);
        } else {
          setTimeout(() => {
            toast.success(
              "Time block added! Courses with conflicts will be filtered out."
            );
          }, 100);
        }

        return mergedBlocks;
      });

      // Reset selection to allow creating another block immediately
      clearSelection();
    }
  };

  // Function to handle time slot touch start
  const handleTimeSlotTouchStart = (day: string, time: number) => {
    if ((!isInTimeBlockMode && isTouchDevice) || !setTimeBlocks) return;

    setTouchStartSlot({ day, time });

    // Initialize drag preview
    setDragPreview({
      id: `preview-${Math.random().toString(36).substring(2, 11)}`,
      day,
      startTime: time,
      duration: 30, // Start with 30 minutes
      label: "Blocked",
    });
  };

  // Function to handle time slot touch move
  const handleTimeSlotTouchMove = (day: string, time: number) => {
    if (!isInTimeBlockMode || !touchStartSlot || !dragPreview) return;

    // Only allow same-day selections
    if (day !== touchStartSlot.day) return;

    // Update the drag preview
    const startTime = Math.min(touchStartSlot.time, time);
    const endTime = Math.max(touchStartSlot.time, time);

    setDragPreview({
      ...dragPreview,
      startTime,
      duration: endTime - startTime + 30, // Include the full end slot
    });
  };

  // Function to handle time slot touch end
  const handleTimeSlotTouchEnd = (day: string, time: number) => {
    if (!isInTimeBlockMode || !touchStartSlot || !setTimeBlocks) return;

    // Only allow same-day selections
    if (day !== touchStartSlot.day) {
      clearSelection();
      return;
    }

    // Create the time block
    const startTime = Math.min(touchStartSlot.time, time);
    const endTime = Math.max(touchStartSlot.time, time);
    const duration = endTime - startTime + 30; // Include the full end slot

    // For very short touches on mobile, create a fixed 30-minute block
    const finalDuration = duration < 30 ? 30 : duration;

    // Don't create blocks less than 15 minutes
    if (finalDuration < 15) {
      clearSelection();
      return;
    }

    const newBlock = {
      id: `block-${Math.random().toString(36).substring(2, 11)}`,
      day: touchStartSlot.day,
      startTime,
      duration: finalDuration,
      label: "Blocked",
    };

    // Add the block and merge any overlapping blocks
    setTimeBlocks((prev) => {
      // First add the new block
      const updatedBlocks = [...prev, newBlock];

      // Then merge any overlapping blocks
      const mergedBlocks = mergeOverlappingBlocks(updatedBlocks);

      // Show toast message
      if (mergedBlocks.length < updatedBlocks.length) {
        setTimeout(() => {
          toast.success("Overlapping time blocks have been merged!");
        }, 100);
      } else {
        setTimeout(() => {
          toast.success("Time block added!");
        }, 100);
      }

      return mergedBlocks;
    });

    // Reset selection to allow creating another block immediately
    clearSelection();
  };

  // Clear the current selection state
  const clearSelection = () => {
    // Clear all selection state to prepare for the next time block creation
    setSelectionStartDay(null);
    setSelectionStartTime(null);
    setSelectionEndDay(null);
    setSelectionEndTime(null);
    setSelectedSlots({});
    setDragPreview(null);
    setTouchStartSlot(null);

    // Small delay to prevent accidental double-clicks from registering as new selections
    setTimeout(() => {
      // Ensure we're still in time block mode
      if (isInTimeBlockMode) {
        // Re-enable selection
      }
    }, 50);
  };

  // Function to handle time slot mouse enter
  const handleTimeSlotMouseEnter = (day: string, time: number) => {
    if (
      (!isInTimeBlockMode && !isTouchDevice) ||
      !selectionStartDay ||
      !selectionStartTime
    )
      return;

    // Only show preview for the same day
    if (day !== selectionStartDay) return;

    // Update the selection end point for visual tracking
    setSelectionEndTime(time);

    // Update the preview
    const startTime = Math.min(selectionStartTime, time);
    const endTime = Math.max(selectionStartTime, time);

    // Update selected slots for visual feedback
    const newSelectedSlots: { [key: string]: boolean } = {};

    // Mark all slots between start and end as selected
    for (let t = startTime; t <= endTime; t += 30) {
      newSelectedSlots[`${day}-${t}`] = true;
    }

    setSelectedSlots(newSelectedSlots);

    // Update drag preview
    setDragPreview({
      id:
        dragPreview?.id ||
        `preview-${Math.random().toString(36).substring(2, 11)}`,
      day,
      startTime,
      duration: endTime - startTime + 30, // Include the full end slot
      label: "Blocked",
    });
  };

  // Remove a timeblock when clicked
  const handleTimeBlockClick = (blockId: string, event: React.MouseEvent) => {
    // Only proceed if it's a timeblock and setTimeBlocks is provided
    if (blockId.startsWith("block-") && setTimeBlocks) {
      event.stopPropagation();
      setTimeBlocks((prev) => prev.filter((block) => block.id !== blockId));
      toast.success("Time block removed");
    }
  };

  // Format display time (8:00 AM format)
  const formatDisplayTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  // Time block creation toggle button for mobile
  const TimeBlockToggle = () => {
    if (!setTimeBlocks || !isTouchDevice) return null;

    return (
      <div className="time-block-toggle-container">
        <button
          className={`time-block-toggle-button ${
            isInTimeBlockMode ? "active" : ""
          }`}
          onClick={() => {
            const newMode = !isInTimeBlockMode;
            setIsInTimeBlockMode(newMode);
            // Reset any active selection operations when toggling mode
            if (!newMode) {
              clearSelection();
            }
          }}
        >
          {isInTimeBlockMode ? "Exit Block Mode" : "Create Time Block"}
        </button>
      </div>
    );
  };

  return (
    <div className="weekly-schedule" ref={scheduleRef}>
      {setTimeBlocks && (
        <div className="time-blocking-hint">
          {isTouchDevice ? (
            <span>
              {isInTimeBlockMode
                ? "Tap on time slots to create blocks. Tap an existing block to remove it."
                : "Toggle 'Create Time Block' mode to block off times in your schedule."}
            </span>
          ) : (
            <span>
              Click and drag on the calendar to block time. Click on a time
              block to remove it.
            </span>
          )}
        </div>
      )}

      {/* Time Block Toggle Button */}
      <TimeBlockToggle />

      {weekStartDate && (
        <div className="schedule-header">
          <div className="schedule-navigation">
            <Button
              onClick={goToPreviousWeek}
              aria-label="Previous week"
              label={`< Previous`}
            />
            <div className="date-range-header">
              {format(weekStartDate, "MMM d")} -{" "}
              {format(addDays(weekStartDate, 4), "MMM d")}
              <Button
                className="mobile-hide"
                onClick={resetToInitialWeek}
                aria-label="Reset to initial week"
                label={"Reset"}
              />
            </div>
            <Button
              onClick={goToNextWeek}
              aria-label="Next week"
              label={`Next >`}
            />
          </div>
        </div>
      )}

      <div
        className={`schedule-grid ${
          isInTimeBlockMode ? "time-block-mode" : ""
        }`}
        ref={gridRef}
      >
        <div className="grid-header">
          <div className="time-label"></div>
          {daysOfWeek.map((day, index) => (
            <div key={day} className="day-header">
              {day}
              {weekStartDate && (
                <div className="day-date">
                  {format(addDays(weekStartDate, index), "MMM d")}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="time-column">
          {timeSlots.map(({ hour, minute }, index) => (
            <div
              key={`${hour}-${minute}`}
              className={`time-label ${
                minute === 30 ? "time-label--half" : ""
              }`}
            >
              {minute === 0 && (
                <span className="time-text">{formatTime(hour)}</span>
              )}
            </div>
          ))}
        </div>

        {daysOfWeek.map((day) => (
          <div key={day} className="day-column">
            {timeSlots.map(({ hour, minute }) => {
              const time = hour * 60 + minute;
              const slotKey = `${day}-${time}`;
              const isSelected = Boolean(selectedSlots[slotKey]);

              return (
                <div
                  key={`${day}-${hour}-${minute}`}
                  className={`time-slot ${
                    minute === 30 ? "time-slot--half" : ""
                  } ${isSelected ? "selected" : ""}`}
                  data-day={day}
                  data-time={time}
                  onClick={() => handleTimeSlotClick(day, time)}
                  onMouseEnter={() => handleTimeSlotMouseEnter(day, time)}
                  onTouchStart={() => handleTimeSlotTouchStart(day, time)}
                  onTouchMove={() => handleTimeSlotTouchMove(day, time)}
                  onTouchEnd={() => handleTimeSlotTouchEnd(day, time)}
                />
              );
            })}
            {timeslots
              .filter((course) => course.day === day)
              .map((course) => {
                const { topOffset, height } = calculateCoursePosition(course);
                const isTimeBlock = course.id.startsWith("block-");

                return (
                  <div
                    key={course.id}
                    className={`course-block ${
                      isTimeBlock ? "time-block" : ""
                    }`}
                    style={{
                      top: `${topOffset}px`,
                      height: `${height}px`,
                      backgroundColor: isTimeBlock
                        ? "rgba(220, 76, 100, 0.7)" // Red-ish for blocked time
                        : getDarkColorFromHash(
                            course.name.split(" ").slice(0, 2).join(" ")
                          ),
                    }}
                    onClick={
                      isTimeBlock
                        ? (e) => handleTimeBlockClick(course.id, e)
                        : undefined
                    }
                  >
                    {isTimeBlock ? (
                      <>
                        <div className="time-block-label">Blocked</div>
                        <div className="time-block-time">
                          {formatDisplayTime(course.startTime)} -{" "}
                          {formatDisplayTime(
                            course.startTime + course.duration
                          )}
                        </div>
                      </>
                    ) : (
                      course.name
                    )}
                  </div>
                );
              })}

            {/* Show drag preview if we have one for this day */}
            {dragPreview && dragPreview.day === day && (
              <div
                className="course-block time-block preview"
                style={{
                  top: `${
                    ((dragPreview.startTime - startHour * 60) / 60) *
                    slotHeight *
                    2
                  }px`,
                  height: `${(dragPreview.duration / 60) * slotHeight * 2}px`,
                  backgroundColor: "rgba(220, 76, 100, 0.5)", // Transparent red
                }}
              >
                <div className="time-block-label">Blocked</div>
                <div className="time-block-time">
                  {formatDisplayTime(dragPreview.startTime)} -{" "}
                  {formatDisplayTime(
                    dragPreview.startTime + dragPreview.duration
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklySchedule;
