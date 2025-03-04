import { CourseWithSectionDetails } from "@types";
import { formatTime, getDarkColorFromHash } from "@utils/format";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import toast from "react-hot-toast";
import Button from "./Button";

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
}) => {
  const [timeslots, setTimeslots] = useState<Course[]>([]);
  const [weekStartDate, setWeekStartDate] = useState<Date | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(1);
  const [initialWeekDate, setInitialWeekDate] = useState<Date | null>(null);

  // Function to calculate visible timeslots for a specific week
  const calculateTimeslotsForWeek = (weekDate: Date) => {
    const newTimeslots: Course[] = [];
    const allConflictMessages: string[] = [];

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
              name: `${course.dept} ${course.number} \n${section.section}\n${section.schedules[0].campus}`,
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

        // Styling
        style: {},
        className: "",

        icon: "🚨",
        // Aria
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },

        // Additional Configuration
        removeDelay: 1000,
      });
    }

    setTimeslots(newTimeslots);
  }, [
    initialWeekDate,
    currentWeekOffset,
    coursesWithSections,
    setCoursesWithSections,
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

  return (
    <div className="weekly-schedule">
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
      <div className="schedule-grid">
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
              />
            ))}
            {timeslots
              .filter((course) => course.day === day)
              .map((course) => {
                const topOffset =
                  ((course.startTime - startHour * 60) / 60) * 45;
                const height = (course.duration / 60) * 45;
                return (
                  <div
                    key={course.id}
                    className="course-block"
                    style={{
                      top: `${topOffset}px`,
                      height: `${height}px`,
                      backgroundColor: getDarkColorFromHash(
                        course.name.split(" ").slice(0, 2).join(" ")
                      ), // CMPT 225
                    }}
                  >
                    {course.name}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklySchedule;
