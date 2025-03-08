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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    day: string;
    time: number;
  } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: string; time: number } | null>(
    null
  );
  const [dragPreview, setDragPreview] = useState<TimeBlock | null>(null);

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

  let timeSlots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push({ hour, minute: 0 }, { hour, minute: 30 });
  }

  // Helper function to calculate position and size
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

  // Helper to get time from mouse position - FIXED VERSION
  const getTimeFromPosition = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return null;

    // Get the grid element's position
    const gridRect = gridRef.current.getBoundingClientRect();

    // Get the day columns
    const dayColumns = gridRef.current.querySelectorAll(".day-column");

    // Get time column to calculate proper offsets
    const timeColumn = gridRef.current.querySelector(".time-column");
    const timeLabels = timeColumn
      ? Array.from(timeColumn.querySelectorAll(".time-label"))
      : [];

    // Get header height
    const headerHeight =
      gridRef.current.querySelector(".grid-header")?.clientHeight || 0;

    // Determine which day column was clicked
    for (let i = 0; i < dayColumns.length; i++) {
      const column = dayColumns[i] as HTMLElement;
      const columnRect = column.getBoundingClientRect();

      if (
        event.clientX >= columnRect.left &&
        event.clientX <= columnRect.right
      ) {
        // Get day
        const day = daysOfWeek[i];

        // Get time with corrections for position
        // 1. Calculate Y position relative to grid
        const relativeY = event.clientY - gridRect.top - 45;

        // 2. Adjust for header height
        const adjustedY = relativeY - headerHeight;

        // 3. Find closest time slot (direct mapping approach)
        // Each slot is slotHeight pixels tall
        const slotIndex = Math.floor(adjustedY / slotHeight);

        // Calculate time from slot index
        // Each 2 slots = 1 hour
        const hourOffset = Math.floor(slotIndex / 2);
        const minuteOffset = (slotIndex % 2) * 30;

        const time = (startHour + hourOffset) * 60 + minuteOffset;

        // Round to nearest 15-minute increment if needed
        // const roundedTime = Math.round(time / 15) * 15;

        return { day, time };
      }
    }

    return null;
  };

  // Handle mouse down - start dragging
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only start drag if clicking directly on a time slot
    if (!(event.target as HTMLElement).classList.contains("time-slot")) return;

    const position = getTimeFromPosition(event);
    if (!position) return;

    setIsDragging(true);
    setDragStart(position);
    setDragEnd(position);

    // Create initial preview
    setDragPreview({
      id: `preview-${Math.random().toString(36).substring(2, 11)}`,
      day: position.day,
      startTime: position.time,
      duration: 15, // Start with 15 minutes
      label: "Blocked",
    });
  };

  // Handle mouse move - update drag preview
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return;

    const position = getTimeFromPosition(event);
    if (!position || position.day !== dragStart.day) return;

    setDragEnd(position);

    // Update preview
    const startTime = Math.min(dragStart.time, position.time);
    const endTime = Math.max(dragStart.time, position.time);

    setDragPreview({
      id:
        dragPreview?.id ||
        `preview-${Math.random().toString(36).substring(2, 11)}`,
      day: dragStart.day,
      startTime,
      duration: endTime - startTime,
      label: "Blocked",
    });
  };

  // Handle mouse up - create block
  const handleMouseUp = () => {
    if (
      !isDragging ||
      !dragPreview ||
      dragPreview.duration < 15 ||
      !setTimeBlocks
    ) {
      // Don't create blocks less than 15 minutes or if setTimeBlocks is not provided
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      setDragPreview(null);
      return;
    }

    // Create new timeblock
    const newBlock = {
      ...dragPreview,
      id: `block-${Math.random().toString(36).substring(2, 11)}`,
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

    // Reset drag state
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setDragPreview(null);
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

  return (
    <div className="weekly-schedule" ref={scheduleRef}>
      {setTimeBlocks && (
        <div className="time-blocking-hint">
          Drag on calendar to block time. Click a time block to remove it.
        </div>
      )}
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
        className="schedule-grid"
        ref={gridRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDragging) handleMouseUp();
        }}
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

        {daysOfWeek.map((day, dayIndex) => (
          <div key={day} className="day-column">
            {timeSlots.map(({ hour, minute }, index) => (
              <div
                key={`${day}-${hour}-${minute}`}
                className={`time-slot ${
                  minute === 30 ? "time-slot--half" : ""
                }`}
                data-day={day}
                data-time={hour * 60 + minute}
              />
            ))}
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

            {/* Show drag preview if we're dragging in this column */}
            {isDragging && dragPreview && dragPreview.day === day && (
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
