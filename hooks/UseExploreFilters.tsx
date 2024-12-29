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
    setQueryQuery: (str: string) => void;
    hasNone: boolean;
    setHasNone: (value: boolean) => void;
  };
}

export const useExploreFilters = (): ExploreFilters => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);

  const [prereqSearchSelected, setPrereqSearchSelected] = useState(false);
  const [prereqSearchQuery, setPrereqSearchQuery] = useState("");
  const [hasNoPrereq, setHasNoPrereq] = useState(false);

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
      setQueryQuery: setPrereqSearchQuery,
      hasNone: hasNoPrereq,
      setHasNone: setHasNoPrereq,
    },
  };
};
