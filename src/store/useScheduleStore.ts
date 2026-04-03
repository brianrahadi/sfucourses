import { create } from "zustand";
import { CourseWithSectionDetails, TimeBlock } from "@types";

interface ScheduleState {
  // Search and Mode
  query: string;
  setQuery: (query: string) => void;
  searchSelected: boolean;
  setSearchSelected: (selected: boolean) => void;
  selectedTerm: string;
  setSelectedTerm: (term: string) => void;

  // Pagination
  sliceIndex: number;
  setSliceIndex: (index: number | ((prev: number) => number)) => void;

  // Filters
  filterConflicts: boolean;
  setFilterConflicts: (filter: boolean) => void;
  campusFilter: string[];
  setCampusFilter: (campus: string[]) => void;
  daysFilter: string[];
  setDaysFilter: (days: string[]) => void;
  timeFilter: { start: string; end: string };
  setTimeFilter: (time: { start: string; end: string }) => void;
  subjectFilter: string[];
  setSubjectFilter: (subjects: string[]) => void;
  levelFilter: string[];
  setLevelFilter: (levels: string[]) => void;
  clearAllFilters: () => void;

  // Selected Data
  selectedOutlinesWithSections: CourseWithSectionDetails[];
  setSelectedOutlinesWithSections: (
    courses:
      | CourseWithSectionDetails[]
      | ((prev: CourseWithSectionDetails[]) => CourseWithSectionDetails[])
  ) => void;
  timeBlocks: TimeBlock[];
  setTimeBlocks: (
    blocks: TimeBlock[] | ((prev: TimeBlock[]) => TimeBlock[])
  ) => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  query: "",
  setQuery: (query) => set({ query }),
  searchSelected: false,
  setSearchSelected: (searchSelected) => set({ searchSelected }),
  selectedTerm: "",
  setSelectedTerm: (selectedTerm) => set({ selectedTerm }),

  sliceIndex: 20,
  setSliceIndex: (index) =>
    set((state) => ({
      sliceIndex: typeof index === "function" ? index(state.sliceIndex) : index,
    })),

  filterConflicts: false,
  setFilterConflicts: (filterConflicts) => set({ filterConflicts }),
  campusFilter: [],
  setCampusFilter: (campusFilter) => set({ campusFilter }),
  daysFilter: [],
  setDaysFilter: (daysFilter) => set({ daysFilter }),
  timeFilter: { start: "", end: "" },
  setTimeFilter: (timeFilter) => set({ timeFilter }),
  subjectFilter: [],
  setSubjectFilter: (subjectFilter) => set({ subjectFilter }),
  levelFilter: [],
  setLevelFilter: (levelFilter) => set({ levelFilter }),
  clearAllFilters: () =>
    set({
      filterConflicts: false,
      campusFilter: [],
      daysFilter: [],
      timeFilter: { start: "", end: "" },
      subjectFilter: [],
      levelFilter: [],
    }),

  selectedOutlinesWithSections: [],
  setSelectedOutlinesWithSections: (courses) =>
    set((state) => ({
      selectedOutlinesWithSections:
        typeof courses === "function"
          ? courses(state.selectedOutlinesWithSections)
          : courses,
    })),

  timeBlocks: [],
  setTimeBlocks: (blocks) =>
    set((state) => ({
      timeBlocks:
        typeof blocks === "function" ? blocks(state.timeBlocks) : blocks,
    })),
}));
