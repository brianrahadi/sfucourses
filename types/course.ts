// import { z, ZodType } from "zod";

// // Define Zod schemas for each data class

// const CourseScheduleSchema = z.object({
//   days: z.string(),
//   sectionCode: z.string(),
//   startTime: z.string(),
//   endTime: z.string(),
// });

// type CourseSchedule = z.infer<typeof CourseScheduleSchema>;

// const SectionInfoSchema = z.object({
//   section: z.string(),
//   classNumber: z.string(),
//   type: z.string(),
//   campus: z.string(),
//   instructorNames: z.array(z.string()),
// });

// export type SectionInfo = z.infer<typeof SectionInfoSchema>;

// const CourseInfoSchema = z.object({
//   dept: z.string(),
//   number: z.string(),
//   title: z.string(),
//   description: z.string(),
//   prerequisites: z.string(),
//   corequisites: z.string(),
//   notes: z.string(),
//   deliveryMethod: z.string(),
//   units: z.string(),
// });

// export type CourseInfo = z.infer<typeof CourseInfoSchema>;

// const SectionSchema = z.object({
//   info: SectionInfoSchema,
//   courseSchedule: z.array(CourseScheduleSchema),
// });

// type Section = z.infer<typeof SectionSchema>;

// const SectionsPerTermSchema = z.object({
//   term: z.string(),
//   sections: z.array(SectionSchema),
// });

// export type SectionsPerTerm = z.infer<typeof SectionsPerTermSchema>;

// export const CourseSchema = z.object({
//   info: CourseInfoSchema,
//   future_sections: SectionsPerTermSchema,
//   last_sections: SectionsPerTermSchema,
// });

// export type Course = z.infer<typeof CourseSchema>;

// export const RequirementSchema = z.object({
//   requirement: z.string(),
//   courses: z.array(CourseSchema),
// });

// export type Requirement = z.infer<typeof RequirementSchema>;

export type Department = {
  /**
   * The display name of the department, typically in uppercase.
   * Example: "CMPT".
   */
  text: string;

  /**
   * The identifier used in URLs or APIs, typically in lowercase.
   * Example: "cmpt".
   */
  value: string;

  /**
   * The full name of the department.
   * Example: "Computer Science".
   */
  name: string;
};

export type Course = {
  /**
   * The course code displayed to users.
   * Example: "105W".
   */
  text: string;

  /**
   * The normalized, lowercase version of the course code.
   * Typically used internally or for URLs.
   * Example: "105w".
   */
  value: string;

  /**
   * The full title of the course.
   * Example: "Professional Responsibility and Technical Writing".
   */
  title: string;
};

export type Section = {
  /**
   * The section code displayed to users.
   * Example: "D100".
   */
  text: string;

  /**
   * The normalized, lowercase version of the section code.
   * Typically used internally or for URLs.
   * Example: "d100".
   */
  value: string;

  /**
   * The full title of the course associated with the section.
   * Example: "Introduction to Insurance".
   */
  title: string;

  /**
   * The type of section.
   * Example: "e" for enrollment, "n" for non-enrollment section.
   */
  classType: string;

  /**
   * The section code, such as "LEC" for lectures or "TUT" for tutorials.
   * Example: "LEC".
   */
  sectionCode: string;

  /**
   * The associated class identifier.
   * Example: "1" (usually refers to a particular course class).
   */
  associatedClass: string;
};

export type DescriptiveSection = {
  info?: {
    notes?: string;
    deliveryMethod?: string;
    description?: string;
    section?: string;
    units?: string;
    title?: string;
    type?: string;
    classNumber?: string;
    departmentalUgradNotes?: string;
    prerequisites?: string;
    number?: string;
    requiredReadingNotes?: string;
    registrarNotes?: string;
    shortNote?: string;
    outlinePath?: string;
    term?: string;
    gradingNotes?: string;
    corequisites?: string;
    dept?: string;
    degreeLevel?: string;
    specialTopic?: string;
    courseDetails?: string;
    materials?: string;
    name?: string;
    designation?: string;
  };
  instructor: Array<{
    profileUrl?: string;
    commonName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    roleCode?: string;
    name?: string;
    officeHours?: string;
    office?: string;
    email?: string;
  }>;
  courseSchedule: Array<{
    endDate?: string;
    campus?: string;
    days?: string;
    sectionCode?: string;
    startTime?: string;
    isExam: boolean;
    endTime?: string;
    startDate?: string;
  }>;
  requiredText: Array<{
    details?: string;
  }>;
};

export type BreadcrumbLink = {
  year: string;
  term: string;
  dept?: string;
  number?: string;
};
