import Select, { SelectInstance } from "react-select";
import { Button } from "@components";
import { SearchBar } from "@components";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { ExploreFilterProps } from "src/hooks/UseExploreFilters";
import { BsSun } from "react-icons/bs";
import { FaLeaf } from "react-icons/fa";
import { LuFlower } from "react-icons/lu";
import { RiResetLeftFill } from "react-icons/ri";
import {
  deliveryOptions,
  levelOptions,
  designationOptions,
  termOptions,
  termToIcon,
} from "@utils/exploreFilters";
import { subjectOptions } from "@utils/exploreFilters";

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
      label={value}
      onClick={onClick}
      type={isSelected ? "primary" : "secondary"}
      icon={icon}
    />
  );
};

export const ExploreFilter: React.FC<ExploreFilterProps> = ({
  subjects,
  levels,
  terms,
  prereqs,
  designations,
  deliveries,
  onReset,
  courseSubjectSelectInputRef,
}) => {
  return (
    <div className="explore-filter">
      <section className="explore-filter__section">
        <div className="explore-filter__top">
          <p>
            <b>Subjects</b>
          </p>
          <Button
            className="explore-filter__reset secondary"
            label={<RiResetLeftFill />}
            onClick={onReset}
          />
        </div>
        <Select
          ref={courseSubjectSelectInputRef}
          className="explore-filter__subject-select"
          options={subjectOptions}
          isMulti={true}
          closeMenuOnSelect={false}
          styles={customStyles}
          onChange={(e) => {
            const selectedSubjects = [];
            for (const subject of e.values()) {
              selectedSubjects.push(subject.value);
            }
            subjects.setSelected(selectedSubjects);
          }}
        />
      </section>
      <section className="explore-filter__section">
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
      </section>
      <section className="explore-filter__section">
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
                icon={termToIcon(term.split(" ")[0])}
              />
            );
          })}
        </div>
      </section>
      <section className="explore-filter__section">
        <p>
          <b>Delivery Method</b>
        </p>
        <div className="explore-filter__section__row">
          {deliveryOptions.map((delivery) => {
            return (
              <FilterButton
                key={delivery}
                value={delivery}
                isSelected={deliveries.selected.includes(delivery)}
                setSelected={deliveries.setSelected}
              />
            );
          })}
        </div>
      </section>
      <section className="explore-filter__section">
        <p>
          <b>Requirements</b>
        </p>
        <SearchBar
          placeholder="prerequisites"
          className="secondary"
          handleInputChange={prereqs.setSearchQuery}
          searchSelected={prereqs.isSearchSelected}
          setSearchSelected={prereqs.setSearchSelected}
          value={prereqs.searchQuery}
          disabled={prereqs.hasNone}
          disabledPlaceholder="no prerequisite"
        />
        <div className="explore-filter__section__row">
          <input
            className="checkbox"
            type="checkbox"
            name="no-prereq"
            id=""
            checked={prereqs.isShown}
            onChange={() => prereqs.setIsShown(!prereqs.isShown)}
          />
          <label htmlFor="">Show prerequisites</label>
        </div>
        <div className="explore-filter__section__row">
          <input
            className="checkbox"
            type="checkbox"
            name="no-prereq"
            id="no-prereq"
            checked={prereqs.hasNone}
            onChange={() => prereqs.setHasNone(!prereqs.hasNone)}
          />
          <label htmlFor="no-prereq">No prerequisite</label>
        </div>
      </section>
      <section className="explore-filter__section">
        <p>
          <b>Designations</b>
        </p>
        <div className="explore-filter__section__row">
          {designationOptions.map((designation) => {
            return (
              <FilterButton
                key={designation}
                value={designation}
                isSelected={designations.selected.includes(designation)}
                setSelected={designations.setSelected}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ExploreFilter;
