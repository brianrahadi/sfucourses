import {
  CourseOutline,
  CourseOutlineWithSectionDetails,
  SectionDetail,
} from "@types";

const isCourseOutlineWithSectionDetails = (
  course: CourseOutline | CourseOutlineWithSectionDetails
): course is CourseOutlineWithSectionDetails => {
  return (course as CourseOutlineWithSectionDetails).sections !== undefined;
};

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

// Filter by subjects
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

// Filter by levels
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

// Filter by delivery methods
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

// Filter by prerequisites
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
