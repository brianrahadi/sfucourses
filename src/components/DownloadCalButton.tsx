import React from "react";
import { CourseWithSectionDetails, SectionSchedule } from "@types";
import { formatISODate, getDayOfWeek } from "@utils/format";
import { CiCalendar } from "react-icons/ci";

interface ICalendarExportProps {
  coursesWithSections: CourseWithSectionDetails[];
}

export const DownloadCalButton: React.FC<ICalendarExportProps> = ({
  coursesWithSections,
}) => {
  const generateICalendarFile = () => {
    let icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SFU Course Scheduler//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ].join("\r\n");

    coursesWithSections.forEach((course) => {
      course.sections.forEach((section) => {
        section.schedules.forEach((schedule) => {
          if (
            !schedule.startDate ||
            !schedule.endDate ||
            !schedule.days ||
            !schedule.startTime ||
            !schedule.endTime
          ) {
            return;
          }

          const daysList = schedule.days.split(",").map((day) => day.trim());

          daysList.forEach((day) => {
            const dayNumber = getDayOfWeek(day);
            if (dayNumber === null) return;

            const event = generateEvent(course, section, schedule, dayNumber);

            icalContent += "\r\n" + event;
          });
        });
      });
    });

    icalContent += "\r\nEND:VCALENDAR";

    return icalContent;
  };

  const generateEvent = (
    course: CourseWithSectionDetails,
    section: any,
    schedule: SectionSchedule,
    dayOfWeek: number
  ): string => {
    const eventUid = `${course.dept}${course.number}-${section.section}-${
      schedule.sectionCode
    }-${Math.random().toString(36).substring(2, 11)}`;

    const summary = `${course.dept} ${course.number} ${section.section} ${schedule.sectionCode}`;

    const location = schedule.campus || "TBA";

    const { startDateStr, endDateStr, recurrenceRule } = formatRecurringDates(
      schedule.startDate,
      schedule.endDate,
      schedule.startTime,
      schedule.endTime,
      dayOfWeek
    );

    const instructors = section.instructors.map((i: any) => i.name).join(", ");

    return [
      "BEGIN:VEVENT",
      `UID:${eventUid}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${course.dept} ${course.number} - ${instructors}`,
      `DTSTART:${startDateStr}`,
      `DTEND:${endDateStr}`,
      `RRULE:${recurrenceRule}`,
      "END:VEVENT",
    ].join("\r\n");
  };

  const formatRecurringDates = (
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string,
    dayOfWeek: number
  ) => {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    const daysToAdd = (dayOfWeek - startDateObj.getDay() + 7) % 7;
    const firstOccurrence = new Date(startDateObj);
    firstOccurrence.setDate(startDateObj.getDate() + daysToAdd);

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    firstOccurrence.setHours(startHour, startMinute, 0);

    const firstOccurrenceEnd = new Date(firstOccurrence);
    firstOccurrenceEnd.setHours(endHour, endMinute, 0);

    const startDateStr = formatISODate(firstOccurrence, true);
    const endDateStr = formatISODate(firstOccurrenceEnd, true);

    const endDateFormatted = formatISODate(endDateObj, false);
    const recurrenceRule = `FREQ=WEEKLY;UNTIL=${endDateFormatted}T235959Z`;

    return { startDateStr, endDateStr, recurrenceRule };
  };

  const downloadCalendar = () => {
    const icalContent = generateICalendarFile();
    const blob = new Blob([icalContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sfu-courses.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      className="utility-button"
      onClick={downloadCalendar}
      disabled={coursesWithSections.length === 0}
    >
      <CiCalendar />
      &nbsp; Download Cal (.ics)
    </button>
  );
};
