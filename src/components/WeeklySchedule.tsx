import { CourseWithSectionDetails } from "@types";
import { formatTime, getColorFromHash, getDarkColorFromHash } from "@utils";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

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
const totalMinutes = (endHour - startHour) * 60;

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
      conflictMessage: `Conflicted with ${ts2.id}`,
    };
  }
  return { hasConflict: false };
};

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  coursesWithSections,
  setCoursesWithSections,
}) => {
  const [timeslots, setTimeslots] = useState<Course[]>([]);

  useEffect(() => {
    const newTimeslots: Course[] = [];
    const allConflictMessages: string[] = [];

    coursesWithSections.forEach((course) => {
      course.sections.forEach((section) => {
        section.schedules.forEach((schedule) => {
          if (!schedule.startTime || !schedule.endTime || !schedule.days) {
            return;
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
              name: `${course.dept} ${course.number}\n${section.section}\n${section.schedules[0].campus}`,
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
    if (allConflictMessages.length > 0) {
      // Combine all conflict messages into a single string
      const combinedConflictMessage = allConflictMessages.join("\n");
      setCoursesWithSections((prev) => {
        const newArray = prev.slice(0, -1);
        return newArray;
      });
      alert(
        `The following conflicts were detected:\n${combinedConflictMessage}`
      );
    }
    setTimeslots(newTimeslots);
  }, [coursesWithSections]);

  let timeSlots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push({ hour, minute: 0 }, { hour, minute: 30 });
  }

  return (
    <div className="weekly-schedule">
      <div className="schedule-grid">
        <div className="grid-header">
          <div className="time-label"></div>
          {daysOfWeek.map((day) => (
            <div key={day} className="day-header">
              {day}
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
                  ((course.startTime - startHour * 60) / 60) * 45; // Increased from 30 to 45
                const height = (course.duration / 60) * 45; // Increased from 30 to 45
                return (
                  <div
                    key={course.id}
                    className="course-block"
                    style={{
                      top: `${topOffset}px`,
                      height: `${height}px`,
                      backgroundColor: getDarkColorFromHash(course.name),
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
