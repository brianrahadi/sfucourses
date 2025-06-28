import { Instructor } from "@types";

export const filterInstructorsByQuery = (
  instructors: Instructor[],
  query: string
): Instructor[] => {
  return instructors.filter((instructor) =>
    instructor.name.toLowerCase().includes(query.toLowerCase())
  );
};
