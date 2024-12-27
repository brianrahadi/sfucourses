// CourseOutline represents the general information about a course
export interface CourseOutline {
  dept: string;
  number: string;
  title: string;
  units: string;
  description: string;
  notes: string;
  designation: string;
  deliveryMethod: string;
  prerequisites: string;
  corequisites: string;
  degreeLevel: string;
  terms: string[];
}

// SectionInfo represents detailed section information
export interface SectionInfo {
  dept: string; // CMPT
  number: string; // 225
  section: string; // D100
  term: string; // Fall 2024
  outlinePath: string; // 2024/fall/cmpt/225/d100
  deliveryMethod: string; // In Person
  classNumber: string; // 6327
}

// SectionInstructor represents an instructor's details
export interface SectionInstructor {
  name: string; // John Doe
  email: string;
}

// SectionSchedule represents a course schedule
export interface SectionSchedule {
  startDate: string;
  endDate: string;
  campus: string;
  days: string;
  startTime: string;
  endTime: string;
  sectionCode: string;
}

// For raw JSON read from SFU courses API
export interface SectionDetailRaw {
  info: SectionInfo;
  instructor: SectionInstructor[]; // Singular for parsing
  courseSchedule: SectionSchedule[]; //
}

// Processed SectionDetail for JSON response
export interface SectionDetail {
  section: string; // D100
  outlinePath: string; // 2024/fall/cmpt/225/d100
  deliveryMethod: string; // In Person
  classNumber: string; // 6327
  instructors: SectionInstructor[];
  schedules: SectionSchedule[];
}

// Course with section details for JSON write
export interface CourseWithSectionDetails {
  dept: string; // CMPT
  number: string; // 225
  term: string; // Fall 2024
  sectionDetails: SectionDetail[];
}
