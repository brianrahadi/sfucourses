import {
  CourseOutline,
  CourseOutlineWithSectionDetails,
  CourseWithSectionDetails,
} from "@types";

const isCourseOutlineWithSectionDetails = (
  course: CourseOutline | CourseOutlineWithSectionDetails
): course is CourseOutlineWithSectionDetails => {
  return (course as CourseOutlineWithSectionDetails).sections !== undefined;
};

export function filterCoursesByClassNumbers(
  courses: CourseWithSectionDetails[],
  classNumbers: string[]
): CourseWithSectionDetails[] {
  return courses
    .map((course) => {
      const filteredSections = course.sections.filter((section) =>
        classNumbers.includes(section.classNumber)
      );

      return {
        ...course,
        sections: filteredSections,
      };
    })
    .filter((course) => course.sections.length > 0);
}

export const filterCoursesByQuery = <T extends CourseOutline>(
  courses: T[],
  query: string
): T[] => {
  if (!query) {
    return courses;
  }

  return courses.filter((course) => {
    const headerText = `${course.dept} ${course.number} - ${course.title} (${course.units})`;

    const instructorsRaw =
      course.offerings &&
      course.offerings
        .map((offering) => offering.instructors.join(""))
        .join("");
    const stringArr = [headerText];

    if (instructorsRaw) {
      stringArr.push(instructorsRaw);
    }

    if (isCourseOutlineWithSectionDetails(course)) {
      const instructors = course.sections
        .flatMap((sec) => sec.instructors.map((a) => a.name))
        .join("");
      stringArr.push(instructors);
    } else {
      stringArr.push(course.description);
    }

    const isQuerySubstring = stringArr.some((str) =>
      str.toLowerCase().includes(query.toLowerCase())
    );
    return isQuerySubstring;
  });
};

export const filterCourseBySubjects = (
  courses: CourseOutline[],
  selectedSubjects: string[]
): CourseOutline[] => {
  if (selectedSubjects.length === 0) {
    return courses;
  }
  const selectedSubjectsSet = new Set(selectedSubjects);
  return courses.filter((course) => selectedSubjectsSet.has(course.dept));
};

export const filterCoursesByLevels = (
  courses: CourseOutline[],
  selectedLevels: string[]
): CourseOutline[] => {
  if (selectedLevels.length === 0) {
    return courses;
  }
  const levelsFirstChar = selectedLevels.map((level) => +level[0]);
  return courses.filter((course) => {
    const courseLevelFirstChar = +course.number[0];
    return levelsFirstChar.some((level) => {
      if (+level >= 5) {
        return courseLevelFirstChar >= 5;
      }
      return courseLevelFirstChar == level;
    });
  });
};

export const filterCoursesByTerm = (
  courses: CourseOutlineWithSectionDetails[],
  term: string
): CourseOutlineWithSectionDetails[] => {
  return courses.filter((course) => course.term === term);
};

// Filter by terms
export const filterCoursesByOfferedTerms = (
  courses: CourseOutline[],
  selectedTerms: string[]
): CourseOutline[] => {
  if (selectedTerms.length === 0) {
    return courses;
  }

  const selectedTermsSet = new Set(selectedTerms);
  return courses.filter((course) => {
    if (!course.offerings) {
      return course;
    }
    return course.offerings.some((offering) =>
      selectedTermsSet.has(offering.term)
    );
  });
};

export const filterCoursesByDeliveries = (
  courses: CourseOutline[],
  selectedDeliveries: string[]
): CourseOutline[] => {
  if (selectedDeliveries.length === 0) {
    return courses;
  }
  const selectedDeliveriesSet = new Set(selectedDeliveries);
  return courses.filter((course) =>
    selectedDeliveriesSet.has(course.deliveryMethod)
  );
};

export const filterCoursesByPrereqs = (
  courses: CourseOutline[],
  searchQuery: string,
  hasNone: boolean
): CourseOutline[] => {
  if (!searchQuery && !hasNone) {
    return courses;
  }
  if (hasNone) {
    return courses.filter(
      (course) => course.prerequisites === "" && +course.number[0] <= 4
    );
  }
  return courses.filter((course) =>
    course.prerequisites.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

// Filter by designations
export const filterCoursesByDesignations = (
  courses: CourseOutline[],
  selectedDesignations: string[]
): CourseOutline[] => {
  if (selectedDesignations.length === 0) {
    return courses;
  }

  const designationSubstringMap: { [name: string]: string } = {
    W: "w",
    Q: "q",
    "B-Sci": "sci",
    "B-Soc": "soc",
    "B-Hum": "hum",
  };

  const designationsSubstrs = selectedDesignations.map(
    (d) => designationSubstringMap[d]
  );

  return courses.filter((course) => {
    return designationsSubstrs.some((substr) => {
      if (substr == "sci") {
        const sciCount = (course.designation.toLowerCase().match(/sci/g) || [])
          .length;
        const socCount = (course.designation.toLowerCase().match(/soc/g) || [])
          .length;
        return sciCount > socCount;
      }
      return course.designation.toLowerCase().includes(substr);
    });
  });
};

export const filterCoursesByReviews = (
  courses: CourseOutline[],
  minReviews: number,
  courseReviewMap: Map<string, { total_reviews: number }>
): CourseOutline[] => {
  if (minReviews === 0) {
    return courses;
  }

  return courses.filter((course) => {
    const courseCode = `${course.dept}${course.number}`.toLowerCase();
    const reviewData = courseReviewMap.get(courseCode);
    const totalReviews = reviewData?.total_reviews || 0;
    return totalReviews >= minReviews;
  });
};

export const filterCoursesByCampus = (
  courses: CourseOutlineWithSectionDetails[],
  campusFilters: string[]
): CourseOutlineWithSectionDetails[] => {
  if (!campusFilters || campusFilters.length === 0) {
    return courses; // Return all courses if no campus is selected
  }

  return courses.filter((course) =>
    course.sections.some((section) => {
      // Check for online courses
      if (campusFilters.includes("Online")) {
        const isOnline =
          section.deliveryMethod === "Online" ||
          section.schedules.some(
            (schedule) =>
              schedule.campus?.toLowerCase() === "online" ||
              (!schedule.campus && section.deliveryMethod === "Online")
          );
        if (isOnline) return true;
      }

      // Check for physical campuses
      return section.schedules.some((schedule) =>
        campusFilters.some(
          (campus) => campus !== "Online" && schedule.campus?.includes(campus)
        )
      );
    })
  );
};

export const filterCoursesByDays = (
  courses: CourseOutlineWithSectionDetails[],
  selectedDays: string[]
): CourseOutlineWithSectionDetails[] => {
  if (selectedDays.length === 0) {
    return courses;
  }

  return courses.filter((course) =>
    course.sections.some((section) =>
      section.schedules.some((schedule) => {
        if (!schedule.days) return false;

        // Convert day abbreviations to match schedule format
        const dayMap: { [key: string]: string } = {
          Mo: "M",
          Tu: "T",
          We: "W",
          Th: "Th",
          Fr: "F",
          Sa: "S",
          Su: "Su",
        };

        const scheduleDays = schedule.days.split("");
        return selectedDays.some((day) => {
          const mappedDay = dayMap[day];
          return (
            scheduleDays.includes(mappedDay) ||
            (day === "Th" && schedule.days.includes("Th")) ||
            (day === "Su" && schedule.days.includes("Su"))
          );
        });
      })
    )
  );
};

export const filterCoursesByTime = (
  courses: CourseOutlineWithSectionDetails[],
  timeFilter: { start: string; end: string }
): CourseOutlineWithSectionDetails[] => {
  if (!timeFilter.start && !timeFilter.end) {
    return courses;
  }

  const parseTimeInput = (timeInput: string): number | null => {
    if (!timeInput.trim()) return null;

    // Handle formats like "8", "08", "8:30", "08:30", "14:15"
    const timeStr = timeInput.trim();

    // If it's just a number (like "8" or "14"), assume it's hours
    if (/^\d{1,2}$/.test(timeStr)) {
      const hour = parseInt(timeStr);
      return hour >= 0 && hour <= 23 ? hour * 60 : null;
    }

    // If it's in HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(":").map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return hours * 60 + minutes;
      }
    }

    return null;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const filterStart = parseTimeInput(timeFilter.start);
  const filterEnd = parseTimeInput(timeFilter.end);

  return courses.filter((course) =>
    course.sections.some((section) =>
      section.schedules.some((schedule) => {
        if (!schedule.startTime || !schedule.endTime) return false;

        const courseStart = timeToMinutes(schedule.startTime);
        const courseEnd = timeToMinutes(schedule.endTime);

        // Course must start after filter start time (if specified)
        // and end before filter end time (if specified)
        const startsAfterFilter =
          filterStart === null || courseStart >= filterStart;
        const endsBeforeFilter = filterEnd === null || courseEnd <= filterEnd;

        return startsAfterFilter && endsBeforeFilter;
      })
    )
  );
};

export const filterCoursesBySubjectsWithSections = (
  courses: CourseOutlineWithSectionDetails[],
  selectedSubjects: string[]
): CourseOutlineWithSectionDetails[] => {
  if (selectedSubjects.length === 0) {
    return courses;
  }
  const selectedSubjectsSet = new Set(selectedSubjects);
  return courses.filter((course) => selectedSubjectsSet.has(course.dept));
};

export const filterCoursesByLevelsWithSections = (
  courses: CourseOutlineWithSectionDetails[],
  selectedLevels: string[]
): CourseOutlineWithSectionDetails[] => {
  if (selectedLevels.length === 0) {
    return courses;
  }
  const levelsFirstChar = selectedLevels.map((level) => +level[0]);
  return courses.filter((course) => {
    const courseLevelFirstChar = +course.number[0];
    return levelsFirstChar.some((level) => {
      if (+level >= 5) {
        return courseLevelFirstChar >= 5;
      }
      return courseLevelFirstChar == level;
    });
  });
};
