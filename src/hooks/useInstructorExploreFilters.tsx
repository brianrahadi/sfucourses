import { Dispatch, SetStateAction, useState } from "react";

export interface InstructorExploreFilters {
  subjects: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
  terms: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
}

export const useInstructorExploreFilters = (): InstructorExploreFilters => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);

  return {
    subjects: {
      selected: selectedSubjects,
      setSelected: setSelectedSubjects,
    },
    terms: {
      selected: selectedTerms,
      setSelected: setSelectedTerms,
    },
  };
};
