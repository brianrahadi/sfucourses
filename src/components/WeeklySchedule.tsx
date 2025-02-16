import React, { useState } from "react";

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

const formatTime = (hour: number, minute: number = 0): string => {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

export const WeeklySchedule: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "mon-math",
      name: "Math",
      startTime: 480,
      duration: 90,
      day: "Mon",
    },
    {
      id: "tue-science",
      name: "Science",
      startTime: 660,
      duration: 60,
      day: "Tue",
    },
    {
      id: "wed-history",
      name: "History",
      startTime: 810,
      duration: 45,
      day: "Wed",
    },
    {
      id: "thu-art",
      name: "Art",
      startTime: 900,
      duration: 120,
      day: "Thu",
    },
    {
      id: "fri-physics",
      name: "Physics",
      startTime: 1020,
      duration: 90,
      day: "Fri",
    },
  ]);

  const addCourse = (
    day: string,
    startTime: number,
    duration: number,
    name: string
  ) => {
    const newCourse: Course = {
      id: `${day}-${startTime}-${duration}`,
      name,
      startTime,
      duration,
      day,
    };
    setCourses((prevCourses) => [...prevCourses, newCourse]);
  };

  const removeCourse = (id: string) => {
    setCourses((prevCourses) =>
      prevCourses.filter((course) => course.id !== id)
    );
  };

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
            {courses
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
                    }}
                    onClick={() => removeCourse(course.id)}
                  >
                    {course.name} ({course.duration} mins)
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
