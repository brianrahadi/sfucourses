import React, { useState } from "react";

interface Course {
  id: string;
  name: string;
  time: string;
  day: string;
}

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const timeSlots = Array.from({ length: 15 }, (_, i) => {
  const hour = 8 + i;
  const period = hour >= 12 ? "pm" : "am";
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}${period}`;
}); // 8:00 AM to 10:00 PM

export const WeeklySchedule: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  // Add a course to the schedule
  const addCourse = (day: string, time: string, name: string) => {
    const newCourse: Course = {
      id: `${day}-${time}`,
      name,
      time,
      day,
    };
    setCourses((prevCourses) => [...prevCourses, newCourse]);
  };

  // Remove a course from the schedule
  const removeCourse = (id: string) => {
    setCourses((prevCourses) =>
      prevCourses.filter((course) => course.id !== id)
    );
  };

  return (
    <div className="weekly-schedule">
      <div className="schedule-grid">
        {/* Header row for days of the week */}
        <div className="grid-header">
          <div className="time-label"></div>
          {daysOfWeek.map((day) => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}
        </div>

        {/* Time slots and course entries */}
        {timeSlots.map((time) => (
          <div key={time} className="time-row">
            <div className="time-label">{time}</div>
            {daysOfWeek.map((day) => {
              const course = courses.find(
                (c) => c.day === day && c.time === time
              );
              return (
                <div
                  key={`${day}-${time}`}
                  className="time-slot"
                  onClick={() => {
                    if (course) {
                      removeCourse(course.id);
                    } else {
                      const courseName = prompt("Enter course name:");
                      if (courseName) {
                        addCourse(day, time, courseName);
                      }
                    }
                  }}
                >
                  {course && <div className="course-entry">{course.name}</div>}
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
