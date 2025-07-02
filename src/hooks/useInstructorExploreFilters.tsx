import { Dispatch, SetStateAction, useRef, useState } from "react";
import { SelectInstance } from "react-select";

export interface InstructorExploreFilters {
  subjects: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
  terms: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
  instructorSubjectSelectInputRef: React.RefObject<SelectInstance<any>>;
  onReset: () => void;
}

export const useInstructorExploreFilters = (): InstructorExploreFilters => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);

  const instructorSubjectSelectInputRef = useRef<SelectInstance<any>>(null);

  const onReset = () => {
    instructorSubjectSelectInputRef.current?.clearValue();
    setSelectedSubjects([]);
    setSelectedTerms([]);
  };

  return {
    subjects: {
      selected: selectedSubjects,
      setSelected: setSelectedSubjects,
    },
    terms: {
      selected: selectedTerms,
      setSelected: setSelectedTerms,
    },
    instructorSubjectSelectInputRef,
    onReset,
  };
};
