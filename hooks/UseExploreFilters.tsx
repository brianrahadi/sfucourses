import { Dispatch, SetStateAction, useState } from "react";

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
    isShown: boolean;
    setIsShown: (value: boolean) => void;
  };
}

export const useExploreFilters = (): ExploreFilters => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);

  const [prereqSearchSelected, setPrereqSearchSelected] = useState(false);
  const [prereqSearchQuery, setPrereqSearchQuery] = useState("");
  const [showPrereqs, setShowPrereqs] = useState(false);
  const [hasNoPrereq, setHasNoPrereq] = useState(false);

  const [selectedDesignations, setSelectedDesignations] = useState<string[]>(
    []
  );
  const [showDesignations, setShowDesignations] = useState(false);

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
      isShown: showDesignations,
      setIsShown: setShowDesignations,
    },
  };
};
