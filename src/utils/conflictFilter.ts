import {
  CourseOutlineWithSectionDetails,
  CourseWithSectionDetails,
  SectionSchedule,
} from "@types";

// Convert time string (HH:MM) to minutes since midnight
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Check if two time ranges overlap
export const timesOverlap = (
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean => {
  return start1 < end2 && start2 < end1;
};

// Get day codes from a days string
export const getDayCodes = (days: string): string[] => {
  // Handle different formats: "Mo, We, Fr" or "Mo,We,Fr"
  return days.split(/,\s*/).map((day) => day.trim());
};

// Check if two schedules conflict
export const schedulesConflict = (
  schedule1: SectionSchedule,
  schedule2: SectionSchedule
): boolean => {
  // Skip if either schedule is missing required data
  if (
    !schedule1.startTime ||
    !schedule1.endTime ||
    !schedule1.days ||
    !schedule2.startTime ||
    !schedule2.endTime ||
    !schedule2.days
  ) {
    return false;
  }

  const start1 = timeToMinutes(schedule1.startTime);
  const end1 = timeToMinutes(schedule1.endTime);
  const start2 = timeToMinutes(schedule2.startTime);
  const end2 = timeToMinutes(schedule2.endTime);

  const days1 = getDayCodes(schedule1.days);
  const days2 = getDayCodes(schedule2.days);

  // If the times overlap and there's at least one day in common, there's a conflict
  const commonDays = days1.filter((day) => days2.includes(day));
  return commonDays.length > 0 && timesOverlap(start1, end1, start2, end2);
};

// Check if a course conflicts with any of the selected courses
export const courseHasConflict = (
  course: CourseWithSectionDetails,
  selectedCourses: CourseWithSectionDetails[]
): boolean => {
  // If no courses are selected, there can't be conflicts
  if (selectedCourses.length === 0) return false;

  // Get all schedules from the course sections
  const courseSchedules = course.sections.flatMap(
    (section) => section.schedules
  );

  // Get all schedules from selected courses
  const selectedSchedules = selectedCourses.flatMap((course) =>
    course.sections.flatMap((section) => section.schedules)
  );

  // Check if any course schedule conflicts with any selected schedule
  return courseSchedules.some((courseSchedule) =>
    selectedSchedules.some((selectedSchedule) =>
      schedulesConflict(courseSchedule, selectedSchedule)
    )
  );
};

// Filter out courses that conflict with selected courses
export const filterConflictingCourses = (
  courses: CourseWithSectionDetails[],
  selectedCourses: CourseWithSectionDetails[]
): CourseWithSectionDetails[] => {
  return courses.filter(
    (course) => !courseHasConflict(course, selectedCourses)
  );
};

// Check if a course conflicts with any of the selected courses
export const courseOutlineHasConflict = (
  course: CourseOutlineWithSectionDetails,
  selectedCourses: CourseOutlineWithSectionDetails[]
): boolean => {
  // If no courses are selected, there can't be conflicts
  if (selectedCourses.length === 0) return false;

  // Get all schedules from the course sections
  const courseSchedules = course.sections.flatMap(
    (section) => section.schedules
  );

  // Get all schedules from selected courses
  const selectedSchedules = selectedCourses.flatMap((course) =>
    course.sections.flatMap((section) => section.schedules)
  );

  // Check if any course schedule conflicts with any selected schedule
  return courseSchedules.some((courseSchedule) =>
    selectedSchedules.some((selectedSchedule) =>
      schedulesConflict(courseSchedule, selectedSchedule)
    )
  );
};

// Filter out courses that conflict with selected courses
export const filterConflictingCoursesWithOutlines = (
  courses: CourseOutlineWithSectionDetails[],
  selectedCourses: CourseWithSectionDetails[]
): CourseOutlineWithSectionDetails[] => {
  return courses.filter(
    (course) => !courseHasConflict(course, selectedCourses)
  );
};
