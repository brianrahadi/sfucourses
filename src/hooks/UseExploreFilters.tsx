import { Dispatch, SetStateAction, useRef, useState } from "react";
import { SelectInstance } from "react-select";

export interface ExploreFilters {
  subjects: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
  levels: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
  terms: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
  deliveries: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
  prereqs: {
    isSearchSelected: boolean;
    setSearchSelected: (value: boolean) => void;
    searchQuery: string;
    setSearchQuery: (str: string) => void;
    isShown: boolean;
    setIsShown: (value: boolean) => void;
    hasNone: boolean;
    setHasNone: (value: boolean) => void;
  };
  designations: {
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
  };
  courseSubjectSelectInputRef: React.RefObject<SelectInstance<any>>;
  onReset: () => void;
}

export const useExploreFilters = (): ExploreFilters => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);

  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);

  const [prereqSearchSelected, setPrereqSearchSelected] = useState(false);
  const [prereqSearchQuery, setPrereqSearchQuery] = useState("");
  const [showPrereqs, setShowPrereqs] = useState(false);
  const [hasNoPrereq, setHasNoPrereq] = useState(false);

  const [selectedDesignations, setSelectedDesignations] = useState<string[]>(
    []
  );

  const courseSubjectSelectInputRef = useRef<SelectInstance<any>>(null);

  const onReset = () => {
    courseSubjectSelectInputRef.current?.clearValue();
    setSelectedSubjects([]);
    setSelectedLevels([]);
    setSelectedTerms([]);
    setSelectedDeliveries([]);
    setPrereqSearchQuery("");
    setShowPrereqs(false);
  };

  return {
    subjects: {
      selected: selectedSubjects,
      setSelected: setSelectedSubjects,
    },
    levels: {
      selected: selectedLevels,
      setSelected: setSelectedLevels,
    },
    terms: {
      selected: selectedTerms,
      setSelected: setSelectedTerms,
    },
    deliveries: {
      selected: selectedDeliveries,
      setSelected: setSelectedDeliveries,
    },
    prereqs: {
      isSearchSelected: prereqSearchSelected,
      setSearchSelected: setPrereqSearchSelected,
      searchQuery: prereqSearchQuery,
      setSearchQuery: setPrereqSearchQuery,
      isShown: showPrereqs,
      setIsShown: setShowPrereqs,
      hasNone: hasNoPrereq,
      setHasNone: setHasNoPrereq,
    },
    designations: {
      selected: selectedDesignations,
      setSelected: setSelectedDesignations,
    },
    courseSubjectSelectInputRef,
    onReset,
  };
};
