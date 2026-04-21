import React from "react";
import { CourseWithSectionDetails, TimeBlock } from "@types";
import { getColorFromHash } from "@utils/format";
import { useTheme } from "next-themes";

interface MiniSchedulePreviewProps {
  courses: CourseWithSectionDetails[];
  timeBlocks?: TimeBlock[];
}

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const startHour = 8;
const endHour = 20;
const totalMinutes = (endHour - startHour) * 60;

const getDayFromCode = (dayCode: string): string[] => {
  const dayMap: { [key: string]: string } = {
    Mo: "Mon",
    Tu: "Tue",
    We: "Wed",
    Th: "Thu",
    Fr: "Fri",
  };
  return dayCode.split(", ").map((code) => dayMap[code]);
};

const convertTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

interface MiniBlock {
  id: string;
  label: string;
  colorKey: string;
  instructor: string;
  timeRange: string;
  day: string;
  startTime: number; // minutes from midnight
  duration: number; // minutes
  isTimeBlock: boolean;
}

export const MiniSchedulePreview: React.FC<MiniSchedulePreviewProps> = ({
  courses,
  timeBlocks = [],
}) => {
  const { resolvedTheme } = useTheme();

  const blocks: MiniBlock[] = [];

  // Process courses
  courses.forEach((course) => {
    course.sections.forEach((section) => {
      section.schedules.forEach((schedule) => {
        if (!schedule.startTime || !schedule.endTime || !schedule.days) return;

        const days = getDayFromCode(schedule.days);
        const start = convertTimeToMinutes(schedule.startTime);
        const end = convertTimeToMinutes(schedule.endTime);
        const duration = end - start;

        days.forEach((day) => {
          const campus = section.schedules[0]?.campus || "";
          const campusShort = campus.toLowerCase().includes("surrey")
            ? "SRY"
            : campus.toLowerCase().includes("burnaby")
            ? "BBY"
            : campus.toLowerCase().includes("vancouver")
            ? "VAN"
            : campus.toLowerCase().includes("online")
            ? "OLN"
            : "";

          const instructorName = section.instructors?.[0]?.name
            ? section.instructors[0].name.split(",")[0]
            : "";

          blocks.push({
            id: `${course.dept}${course.number}-${section.section}-${day}`,
            label: `${course.dept} ${course.number}${
              campusShort ? ` ${campusShort}` : ""
            }`,
            colorKey: `${course.dept} ${course.number}`,
            instructor: instructorName,
            timeRange: `${schedule.startTime}-${schedule.endTime}`,
            day,
            startTime: start,
            duration,
            isTimeBlock: false,
          });
        });
      });
    });
  });

  // Process time blocks
  timeBlocks.forEach((block) => {
    blocks.push({
      id: block.id,
      label: "Blocked",
      colorKey: "Blocked",
      instructor: "",
      timeRange: "",
      day: block.day,
      startTime: block.startTime,
      duration: block.duration,
      isTimeBlock: true,
    });
  });

  if (blocks.length === 0) {
    return (
      <div className="mini-schedule-preview mini-schedule-preview--empty">
        <span>Empty schedule</span>
      </div>
    );
  }

  const timeLabels = [];
  for (let h = startHour; h < endHour; h += 1) {
    timeLabels.push(h);
  }

  return (
    <div className="mini-schedule-preview">
      <div className="mini-schedule-grid">
        {/* Day headers */}
        <div className="mini-day-headers">
          <div className="mini-time-header"></div>
          {daysOfWeek.map((day) => (
            <div key={day} className="mini-day-header">
              {day}
            </div>
          ))}
        </div>
        {/* Grid body with time column + day columns */}
        <div className="mini-grid-body">
          <div className="mini-time-column">
            {timeLabels.map((h) => {
              const topPercent =
                ((h - startHour) / (endHour - startHour)) * 100;
              return (
                <span
                  key={h}
                  className="mini-time-label"
                  style={{ top: `${topPercent}%` }}
                >
                  {h > 12 ? h - 12 : h}
                  {h >= 12 ? "p" : "a"}
                </span>
              );
            })}
          </div>
          <div className="mini-day-columns">
            {daysOfWeek.map((day) => (
              <div key={day} className="mini-day-column">
                {/* Grid lines every 30 min */}
                {Array.from({ length: (endHour - startHour) * 2 }).map(
                  (_, i) => (
                    <div
                      key={`line-${i}`}
                      className={`mini-grid-line ${
                        i % 2 === 1 ? "mini-grid-line--hour" : ""
                      }`}
                      style={{
                        top: `${(i / ((endHour - startHour) * 2)) * 100}%`,
                        height: `${(1 / ((endHour - startHour) * 2)) * 100}%`,
                      }}
                    />
                  )
                )}
                {blocks
                  .filter((b) => b.day === day)
                  .map((block) => {
                    const topPercent =
                      ((block.startTime - startHour * 60) / totalMinutes) * 100;
                    const heightPercent = (block.duration / totalMinutes) * 100;

                    return (
                      <div
                        key={block.id}
                        className={`mini-block ${
                          block.isTimeBlock ? "mini-block--time" : ""
                        }`}
                        style={{
                          top: `${topPercent}%`,
                          height: `${Math.max(heightPercent, 3)}%`,
                          backgroundColor: block.isTimeBlock
                            ? "rgba(220, 76, 100, 0.7)"
                            : getColorFromHash(
                                block.colorKey,
                                resolvedTheme === "light"
                              ),
                        }}
                        title={block.label}
                      >
                        <span className="mini-block-label">{block.label}</span>
                        {block.instructor && (
                          <span className="mini-block-sub">
                            {block.instructor}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniSchedulePreview;
