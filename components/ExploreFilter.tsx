import Select from "react-select";
import { capitalize } from "utils";
import { Button } from "@components";
import { SearchBar } from "./SearchBar";
import { Dispatch, SetStateAction, useState } from "react";
import { ExploreFilters } from "hooks/UseExploreFilters";

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

const levelOptions = ["1XX", "2XX", "3XX", "4XX", "5XX+"];
const termOptions = ["Spring 2024", "Summer 2024", "Fall 2024", "Spring 2025"];

interface FilterButtonProps {
  icon?: JSX.Element;
  value: string;
  isSelected: boolean;
  setSelected: Dispatch<SetStateAction<string[]>>;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  icon,
  value,
  isSelected,
  setSelected,
}) => {
  const onClick = () => {
    if (isSelected) {
      setSelected((selections) =>
        selections.filter((selection) => selection !== value)
      );
    } else {
      setSelected((selections) => selections.concat(value));
    }
  };
  return (
    <Button
      className="filter-button"
      label={value}
      onClick={onClick}
      type={isSelected ? "primary" : "secondary"}
    />
  );
};

export const ExploreFilter: React.FC<ExploreFilters> = ({
  subjects,
  levels,
  terms,
  prereqs,
}) => {
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
          // onChange={}
          // onChange={(e) => {
          //   const values = e.;
          //   for (const v of values) {

          //   }
          // }}
        />
      </div>
      <div className="explore-filter__section">
        <p>
          <b>Level</b>
        </p>
        <div className="explore-filter__section__row">
          {levelOptions.map((level) => {
            return (
              <FilterButton
                key={level}
                value={level}
                isSelected={levels.selected.includes(level)}
                setSelected={levels.setSelected}
              />
            );
          })}
        </div>
      </div>
      <div className="explore-filter__section">
        <p>
          <b>Terms</b>
        </p>
        <div className="explore-filter__section__row">
          {termOptions.map((term) => {
            return (
              <FilterButton
                key={term}
                value={term}
                isSelected={terms.selected.includes(term)}
                setSelected={terms.setSelected}
              />
            );
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
          handleInputChange={prereqs.setQueryQuery}
          searchSelected={prereqs.isSearchSelected}
          setSearchSelected={prereqs.setSearchSelected}
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
