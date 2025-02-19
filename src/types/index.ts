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
  offerings?: CourseOffering[];
}

export interface CourseOffering {
  instructors: string[];
  term: string;
}

export interface CourseWithSectionDetails {
  dept: string; // CMPT
  number: string; // 225
  term: string; // Fall 2024
  sections: SectionDetail[];
}

export interface CourseOutlineWithSectionDetails
  extends CourseOutline,
    CourseWithSectionDetails {}

export interface SectionInfo {
  dept: string; // CMPT
  number: string; // 225
  section: string; // D100
  term: string; // Fall 2024
  deliveryMethod: string; // In Person
  classNumber: string; // 6327
}

// Processed SectionDetail for JSON response
export interface SectionDetail {
  section: string; // D100
  deliveryMethod: string; // In Person
  classNumber: string; // 6327
  instructors: SectionInstructor[];
  schedules: SectionSchedule[];
}

export interface SectionInstructor {
  name: string; // John Doe
  email: string;
}

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
