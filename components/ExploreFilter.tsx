import Select from "react-select";
import { capitalize } from "utils";
import { Button } from "@components";
import { SearchBar } from "./SearchBar";
import { useState } from "react";

export const SUBJECTS = [
  "ACMA",
  "ALS",
  "APMA",
  "ARAB",
  "ARCH",
  "BISC",
  "BPK",
  "BUS",
  "CA",
  "CENV",
  "CHEM",
  "CHIN",
  "CMNS",
  "CMPT",
  "COGS",
  "CRIM",
  "DATA",
  "DIAL",
  "DMED",
  "EASC",
  "ECO",
  "ECON",
  "EDPR",
  "EDUC",
  "ENGL",
  "ENSC",
  "ENV",
  "EVSC",
  "FAL",
  "FAN",
  "FASS",
  "FEP",
  "FREN",
  "GA",
  "GEOG",
  "GERM",
  "GERO",
  "GRAD",
  "GRK",
  "GSWS",
  "HIST",
  "HSCI",
  "HUM",
  "IAT",
  "INDG",
  "INLG",
  "INS",
  "IS",
  "ITAL",
  "JAPN",
  "LANG",
  "LBRL",
  "LBST",
  "LING",
  "LS",
  "MACM",
  "MASC",
  "MATH",
  "MBB",
  "MSE",
  "NEUR",
  "NUSC",
  "ONC",
  "PERS",
  "PHIL",
  "PHYS",
  "PLAN",
  "PLCY",
  "POL",
  "PORT",
  "PSYC",
  "PUB",
  "PUNJ",
  "REM",
  "SA",
  "SCI",
  "SD",
  "SDA",
  "SEE",
  "SPAN",
  "STAT",
  "TEKX",
  "UGRAD",
  "URB",
  "WL",
];

const subjectOptions = SUBJECTS.map((subj) => {
  return { value: subj.toLowerCase(), label: subj };
});

const colourNeutral1000 = "#323434";
const colourNeutral900 = "#4b4e4d";
const colourNeutral800 = "#646867";
const customStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: colourNeutral1000,
    border: 0,
    borderColor: colourNeutral800,
    color: "#fff",
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: colourNeutral1000,
    color: "#fff",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? colourNeutral900 : colourNeutral1000,
    cursor: "pointer",
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: colourNeutral900,
    color: "#fff",
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: "#fff",
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: "#fff",
    ":hover": {
      backgroundColor: colourNeutral800,
      color: "#fff",
    },
  }),
};

const levels = ["1XX", "2XX", "3XX", "4XX", "5XX+"];
const terms = ["Spring 2024", "Summer 2024", "Fall 2024", "Spring 2025"];

interface FilterButtonProps {
  icon?: JSX.Element;
  isSelected: boolean;
  label: string;
  setSelections?: (selected: string[]) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  icon,
  isSelected,
  label,
  setSelections,
}) => {
  return (
    <Button
      className="filter-button"
      label={label}
      type={isSelected ? "primary" : "secondary"}
    />
  );
};

interface ExploreFilterProps {
  subjects: {
    selected: string[];
    setSelected: (selected: string[]) => void;
  };
  levels: {
    selected: string[];
    setSelected: (selected: string[]) => void;
  };
  terms: {
    selected: string[];
    setSelected: (selected: string[]) => void;
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

export const ExploreFilter: React.FC = () => {
  const [prereqSearchSelected, setPrereqSearchSelected] = useState(false);
  const [prereqSearchQuery, setPrereqSearchQuery] = useState("");
  // console.log(subjectOptions)
  return (
    <div className="explore-filter">
      <div className="explore-filter__section">
        <p>
          <b>Subjects</b>
        </p>
        <Select
          className="explore-filter__subject-select"
          options={subjectOptions}
          isMulti={true}
          closeMenuOnSelect={false}
          styles={customStyles}
          placeholder={""}
        />
      </div>
      <div className="explore-filter__section">
        <p>
          <b>Level</b>
        </p>
        <div className="explore-filter__section__row">
          {levels.map((level) => {
            return (
              <FilterButton key={level} label={level} isSelected={false} />
            );
          })}
        </div>
      </div>
      <div className="explore-filter__section">
        <p>
          <b>Terms</b>
        </p>
        <div className="explore-filter__section__row">
          {terms.map((term) => {
            return <FilterButton key={term} label={term} isSelected={false} />;
          })}
        </div>
      </div>
      <div className="explore-filter__section">
        <p>
          <b>Requirements</b>
        </p>
        <SearchBar
          placeholder="prerequisites"
          className="secondary"
          handleInputChange={setPrereqSearchQuery}
          searchSelected={prereqSearchSelected}
          setSearchSelected={setPrereqSearchSelected}
        />
        <div className="explore-filter__section__row">
          <input className="checkbox" type="checkbox" name="no-prereq" id="" />
          <label htmlFor="">No prerequisite</label>
        </div>
      </div>
    </div>
  );
};

export default ExploreFilter;
