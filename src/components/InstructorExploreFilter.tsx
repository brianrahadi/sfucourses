import Select, { SelectInstance } from "react-select";
import { Button } from "@components";
import { Dispatch, SetStateAction, useRef } from "react";
import { BsSun } from "react-icons/bs";
import { FaLeaf } from "react-icons/fa";
import { LuFlower } from "react-icons/lu";
import { RiResetLeftFill } from "react-icons/ri";
import { SUBJECTS } from "@const";
import { InstructorExploreFilters } from "@hooks";
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

const subjectOptions = SUBJECTS.map((subj) => {
  return { value: subj, label: subj };
});
const termOptions = ["Fall 2024", "Spring 2025", "Summer 2025", "Fall 2025"];
export const termToIcon = (term: string) => {
  switch (term) {
    case "Fall":
      return <FaLeaf color="brown" />;
    case "Spring":
      return <LuFlower color="skyblue" />;
    case "Summer":
      return <BsSun color="orange" />;
  }
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

export const InstructorExploreFilter: React.FC<InstructorExploreFilters> = ({
  subjects,
  terms,
}) => {
  const selectInputRef = useRef<SelectInstance<any>>(null);

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
            onClick={() => {
              selectInputRef?.current?.clearValue();
              subjects.setSelected([]);
              terms.setSelected([]);
            }}
          />
        </div>
        <Select
          ref={selectInputRef}
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
    </div>
  );
};

export default InstructorExploreFilter;
