import { Instructor } from "@types";

export const filterInstructorsByQuery = (
  instructors: Instructor[],
  query: string
): Instructor[] => {
  if (!query) {
    return instructors;
  }

  return instructors.filter((instructor) => {
    const isInstructor = instructor.name
      .toLowerCase()
      .includes(query.toLowerCase());
    const isInstructorOffering = instructor.offerings.some((offering) =>
      `${offering.dept} ${offering.number}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
    return isInstructor || isInstructorOffering;
  });
};

export const filterInstructorsBySubject = (
  instructors: Instructor[],
  subjects: string[]
): Instructor[] => {
  if (subjects.length === 0) {
    return instructors;
  }

  return instructors.filter((instructor) =>
    instructor.offerings.some((offering) =>
      subjects.some((subject) => {
        return offering.dept.toLowerCase() == subject.toLowerCase();
      })
    )
  );
};

export const filterInstructorsByTerm = (
  instructors: Instructor[],
  terms: string[]
): Instructor[] => {
  if (terms.length === 0) {
    return instructors;
  }

  return instructors.filter((instructor) =>
    instructor.offerings.some((offering) =>
      terms.some((term) =>
        offering.term.toLowerCase().includes(term.toLowerCase())
      )
    )
  );
};
