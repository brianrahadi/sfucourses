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
  title: string;
  units: string;
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

export interface Instructor {
  name: string;
  offerings: InstructorOffering[];
}

export interface InstructorOffering {
  dept: string;
  number: string;
  term: string;
  title: string;
}

export interface SectionSchedule {
  startDate: string; // Ex: 2024-09-04
  endDate: string; // Ex: 2024-12-04
  campus: string; // Ex: Burnaby
  days: string; // Ex: Mo, We
  startTime: string; // Ex: 10:30
  endTime: string; // Ex: 11:20
  sectionCode: string; // Ex: LEC
}

// For raw JSON read from SFU courses API
export interface SectionDetailRaw {
  info: SectionInfo;
  instructor: SectionInstructor[]; // Singular for parsing
  courseSchedule: SectionSchedule[]; //
}

export interface TimeBlock {
  id: string;
  day: string;
  startTime: number; // in minutes since start of day
  duration: number; // in minutes
  label: string;
}

// Review metadata information
export interface ReviewMetadata {
  forCredit: string; // "For Credit"
  attendance: string; // "Attendance"
  wouldTakeAgain: string; // "Would Take Again"
  grade: string; // "Grade"
  textbook: string; // "Textbook"
  onlineClass?: string; // "Online Class" (optional)
}

// Detailed review information
export interface Review {
  rating: string;
  difficulty: string;
  course_code: string;
  date: string;
  metadata: ReviewMetadata;
  review_msg: string;
  helpful: string;
  not_helpful: string;
  tags: string[];
}

// Instructor-level review data from RateMyProfessors
export interface InstructorReviewData {
  professor_id: string;
  professor_name: string;
  overall_rating: string;
  would_take_again: string;
  difficulty_level: string;
  department: string;
  total_ratings: string;
  reviews: Review[];
}

// Summary information for an instructor
export interface InstructorSummary {
  professorId: string;
  professor_name: string;
  department: string;
  avg_rating: number;
  avg_difficulty: number;
  review_count: number;
  would_take_again: string;
}

// Course-level review data aggregated from instructors
export interface CourseReviewData {
  course_code: string;
  totalReviews: number;
  instructors: InstructorSummary[];
}

// Professor summary review data
export interface ProfessorSummary {
  professorId: string;
  name: string;
  department: string;
  quality: number;
  difficulty: number;
  ratings: number;
  wouldTakeAgain: string;
  url: string;
}
