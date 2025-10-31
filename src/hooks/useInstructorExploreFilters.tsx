import { Dispatch, SetStateAction, useRef, useState } from "react";
import { SelectInstance } from "react-select";

export type InstructorSortState =
  | "quality-asc"
  | "quality-desc"
  | "difficulty-asc"
  | "difficulty-desc"
  | "would-take-again-asc"
  | "would-take-again-desc"
  | "reviews-asc"
  | "reviews-desc"
  | null;

export interface InstructorExploreFilters {
  subjects: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
  terms: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
  reviews: {
    minReviews: number;
    setMinReviews: Dispatch<SetStateAction<number>>;
  };
  sort: {
    value: InstructorSortState;
    setValue: Dispatch<SetStateAction<InstructorSortState>>;
  };
  instructorSubjectSelectInputRef: React.RefObject<SelectInstance<any>>;
  onReset: () => void;
}

export type InstructorExploreFilterProps = Omit<
  InstructorExploreFilters,
  "sort"
>;

export const useInstructorExploreFilters = (): InstructorExploreFilters => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [minReviews, setMinReviews] = useState<number>(0);
  const [sortValue, setSortValue] = useState<InstructorSortState>(null);

  const instructorSubjectSelectInputRef = useRef<SelectInstance<any>>(null);

  const onReset = () => {
    instructorSubjectSelectInputRef.current?.clearValue();
    setSelectedSubjects([]);
    setSelectedTerms([]);
    setMinReviews(0);
    setSortValue(null);
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
    reviews: {
      minReviews,
      setMinReviews,
    },
    sort: {
      value: sortValue,
      setValue: setSortValue,
    },
    instructorSubjectSelectInputRef,
    onReset,
  };
};
