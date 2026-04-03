import { create } from "zustand";
import { SortState } from "src/hooks/UseExploreFilters";
import { InstructorSortState } from "src/hooks/useInstructorExploreFilters";

interface ExploreState {
  mode: "courses" | "instructors";
  setMode: (mode: "courses" | "instructors") => void;

  query: string;
  setQuery: (query: string) => void;
  searchSelected: boolean;
  setSearchSelected: (selected: boolean) => void;

  courseSliceIndex: number;
  setCourseSliceIndex: (index: number | ((prev: number) => number)) => void;
  instructorSliceIndex: number;
  setInstructorSliceIndex: (index: number | ((prev: number) => number)) => void;

  // Course Filters
  courseSubjects: string[];
  setCourseSubjects: (subjects: string[]) => void;
  courseLevels: string[];
  setCourseLevels: (levels: string[]) => void;
  courseTerms: string[];
  setCourseTerms: (terms: string[]) => void;
  courseDeliveries: string[];
  setCourseDeliveries: (deliveries: string[]) => void;

  coursePrereqSearchQuery: string;
  setCoursePrereqSearchQuery: (query: string) => void;
  coursePrereqIsShown: boolean;
  setCoursePrereqIsShown: (isShown: boolean) => void;
  coursePrereqHasNone: boolean;
  setCoursePrereqHasNone: (hasNone: boolean) => void;

  courseDesignations: string[];
  setCourseDesignations: (designations: string[]) => void;
  courseMinReviews: number;
  setCourseMinReviews: (minReviews: number) => void;
  courseSortValue: SortState;
  setCourseSortValue: (sortValue: SortState) => void;

  resetCourseFilters: () => void;

  // Instructor Filters
  instructorSubjects: string[];
  setInstructorSubjects: (subjects: string[]) => void;
  instructorTerms: string[];
  setInstructorTerms: (terms: string[]) => void;
  instructorMinReviews: number;
  setInstructorMinReviews: (minReviews: number) => void;
  instructorSortValue: InstructorSortState;
  setInstructorSortValue: (sortValue: InstructorSortState) => void;

  resetInstructorFilters: () => void;
}

export const useExploreStore = create<ExploreState>((set) => ({
  mode: "courses",
  setMode: (mode) => set({ mode }),

  query: "",
  setQuery: (query) => set({ query }),
  searchSelected: false,
  setSearchSelected: (searchSelected) => set({ searchSelected }),

  courseSliceIndex: 20,
  setCourseSliceIndex: (index) =>
    set((state) => ({
      courseSliceIndex:
        typeof index === "function" ? index(state.courseSliceIndex) : index,
    })),
  instructorSliceIndex: 20,
  setInstructorSliceIndex: (index) =>
    set((state) => ({
      instructorSliceIndex:
        typeof index === "function" ? index(state.instructorSliceIndex) : index,
    })),

  // Course Filters
  courseSubjects: [],
  setCourseSubjects: (courseSubjects) => set({ courseSubjects }),
  courseLevels: [],
  setCourseLevels: (courseLevels) => set({ courseLevels }),
  courseTerms: [],
  setCourseTerms: (courseTerms) => set({ courseTerms }),
  courseDeliveries: [],
  setCourseDeliveries: (courseDeliveries) => set({ courseDeliveries }),

  coursePrereqSearchQuery: "",
  setCoursePrereqSearchQuery: (coursePrereqSearchQuery) =>
    set({ coursePrereqSearchQuery }),
  coursePrereqIsShown: false,
  setCoursePrereqIsShown: (coursePrereqIsShown) => set({ coursePrereqIsShown }),
  coursePrereqHasNone: false,
  setCoursePrereqHasNone: (coursePrereqHasNone) => set({ coursePrereqHasNone }),

  courseDesignations: [],
  setCourseDesignations: (courseDesignations) => set({ courseDesignations }),
  courseMinReviews: 0,
  setCourseMinReviews: (courseMinReviews) => set({ courseMinReviews }),
  courseSortValue: null,
  setCourseSortValue: (courseSortValue) => set({ courseSortValue }),

  resetCourseFilters: () =>
    set({
      courseSubjects: [],
      courseLevels: [],
      courseTerms: [],
      courseDeliveries: [],
      coursePrereqSearchQuery: "",
      coursePrereqIsShown: false,
      coursePrereqHasNone: false,
      courseDesignations: [],
      courseMinReviews: 0,
      courseSortValue: null,
    }),

  // Instructor Filters
  instructorSubjects: [],
  setInstructorSubjects: (instructorSubjects) => set({ instructorSubjects }),
  instructorTerms: [],
  setInstructorTerms: (instructorTerms) => set({ instructorTerms }),
  instructorMinReviews: 0,
  setInstructorMinReviews: (instructorMinReviews) =>
    set({ instructorMinReviews }),
  instructorSortValue: null,
  setInstructorSortValue: (instructorSortValue) => set({ instructorSortValue }),

  resetInstructorFilters: () =>
    set({
      instructorSubjects: [],
      instructorTerms: [],
      instructorMinReviews: 0,
      instructorSortValue: null,
    }),
}));
