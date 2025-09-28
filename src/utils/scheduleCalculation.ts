import { CourseWithSectionDetails } from "@types";

export interface ScheduleInsights {
  maxHours: number;
  averageDailyHours: number;
  totalHours: number;
  commuteFactor: number;
  earliestTime: number | null;
  latestTime: number | null;
  qualityScore: number;
  qualityLabel: string;
  qualityReasoning: string;
}

const convertTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
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

export const calculateScheduleInsights = (
  courses: CourseWithSectionDetails[]
): ScheduleInsights => {
  const hasNoSchedules = courses.every((course) =>
    course.sections.every(
      (section) =>
        section.schedules.length === 0 ||
        section.schedules.every(
          (schedule) => !schedule.startTime || !schedule.endTime
        )
    )
  );

  if (!courses.length || hasNoSchedules) {
    return {
      maxHours: 0,
      averageDailyHours: 0,
      totalHours: 0,
      commuteFactor: 0,
      earliestTime: null,
      latestTime: null,
      qualityScore: 100, // Give 100% score if no schedule
      qualityLabel: "No Schedule",
      qualityReasoning: "No courses selected or no schedules available",
    };
  }

  const dailyHours: { [day: string]: number } = {};
  const dailyCampuses: { [day: string]: Set<string> } = {};
  let earliestMinutes = Infinity;
  let latestMinutes = -Infinity;
  let totalWeeklyHours = 0;

  courses.forEach((course) => {
    course.sections.forEach((section) => {
      section.schedules.forEach((schedule) => {
        if (!schedule.startTime || !schedule.endTime || !schedule.days) return;

        const startMinutes = convertTimeToMinutes(schedule.startTime);
        const endMinutes = convertTimeToMinutes(schedule.endTime);
        const duration = endMinutes - startMinutes;
        const durationHours = duration / 60;

        // Track earliest and latest times
        earliestMinutes = Math.min(earliestMinutes, startMinutes);
        latestMinutes = Math.max(latestMinutes, endMinutes);

        // Calculate daily hours and track campuses per day
        const days = getDayFromCode(schedule.days);
        days.forEach((day) => {
          if (!dailyHours[day]) dailyHours[day] = 0;
          if (!dailyCampuses[day]) dailyCampuses[day] = new Set();

          dailyHours[day] += durationHours;
          if (schedule.campus) {
            dailyCampuses[day].add(schedule.campus);
          }
        });

        totalWeeklyHours += durationHours * days.length;
      });
    });
  });

  const dailyHourValues = Object.values(dailyHours);
  const maxHours =
    dailyHourValues.length > 0 ? Math.max(...dailyHourValues) : 0;
  const averageDailyHours =
    dailyHourValues.length > 0
      ? dailyHourValues.reduce((sum, hours) => sum + hours, 0) /
        dailyHourValues.length
      : 0;

  // Calculate total commute factor (sum across all days)
  let totalCommuteFactor = 0;
  const daysWithClasses = Object.keys(dailyCampuses);

  daysWithClasses.forEach((day) => {
    const campusesOnDay = dailyCampuses[day];
    if (campusesOnDay.size === 1) {
      // One campus: home -> campus -> home = 2x factor
      totalCommuteFactor += 2;
    } else if (campusesOnDay.size > 1) {
      // Multiple campuses: home -> campus1 -> campus2 -> ... -> home
      // Each transition = 1 factor, plus return home = 1 factor
      totalCommuteFactor += campusesOnDay.size + 1;
    }
  });

  // Calculate quality score with detailed reasoning
  let qualityScore = 100;
  const qualityReasons: string[] = [];

  // Penalize very early (before 9am) or very late (after 5pm) classes
  if (earliestMinutes <= 9 * 60) {
    qualityScore -= 15;
    qualityReasons.push(
      "Early morning classes (before 9 AM) can be challenging"
    );
  }
  if (latestMinutes >= 17 * 60) {
    qualityScore -= 10;
    qualityReasons.push(
      "Late evening classes (after 5 PM) may interfere with personal time"
    );
  }

  // Penalize excessive daily hours (over 6 hours)
  if (maxHours > 6) {
    qualityScore -= (maxHours - 6) * 5;
    qualityReasons.push(
      `Heavy daily load (${maxHours}h max) can be overwhelming`
    );
  }

  // Penalize excessive commuting
  if (totalCommuteFactor > daysWithClasses.length * 2) {
    const excessFactor = totalCommuteFactor - daysWithClasses.length * 2;
    qualityScore -= excessFactor * 3;
    qualityReasons.push(
      `High commute factor (${totalCommuteFactor}x) increases daily travel`
    );
  }

  // Reward balanced schedule (consistent daily hours)
  if (dailyHourValues.length > 1) {
    const variance =
      dailyHourValues.reduce((sum, hours) => {
        return sum + Math.pow(hours - averageDailyHours, 2);
      }, 0) / dailyHourValues.length;
    if (variance > 4) {
      qualityScore -= 10;
      qualityReasons.push("Unbalanced schedule with inconsistent daily hours");
    } else {
      qualityReasons.push("Well-balanced daily schedule");
    }
  }

  // Reward reasonable total hours (8-15 hours per week is ideal)
  if (totalWeeklyHours < 8) {
    qualityScore -= (12 - totalWeeklyHours) * 2;
    qualityReasons.push("Relatively light course load");
  } else if (totalWeeklyHours > 15) {
    qualityScore -= (totalWeeklyHours - 15) * 1.5;
    qualityReasons.push("Heavy course load may be challenging to manage");
  } else {
    qualityReasons.push("Optimal weekly hour range (8-15 hours)");
  }

  // Add positive reasons for high scores
  if (earliestMinutes >= 9 * 60 && latestMinutes < 17 * 60) {
    qualityReasons.push("Classes during optimal hours (9 AM - 5 PM)");
  }
  if (totalCommuteFactor === daysWithClasses.length * 2) {
    qualityReasons.push("Minimal commute factor - all classes on same campus");
  }

  qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)));

  let qualityLabel = "Excellent";
  if (qualityScore < 90) qualityLabel = "Good";
  if (qualityScore < 80) qualityLabel = "Fair";
  if (qualityScore < 70) qualityLabel = "Poor";
  if (qualityScore < 60) qualityLabel = "Very Poor";

  const qualityReasoning = qualityReasons.join(" • ");

  return {
    maxHours: Math.round(maxHours * 10) / 10,
    averageDailyHours: Math.round(averageDailyHours * 10) / 10,
    totalHours: Math.round(totalWeeklyHours * 10) / 10,
    commuteFactor: totalCommuteFactor,
    earliestTime: earliestMinutes === Infinity ? null : earliestMinutes,
    latestTime: latestMinutes === -Infinity ? null : latestMinutes,
    qualityScore,
    qualityLabel,
    qualityReasoning,
  };
};
