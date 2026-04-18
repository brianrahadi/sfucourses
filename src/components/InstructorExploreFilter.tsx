import Select, { SelectInstance } from "react-select";
import { Button } from "@components";
import { useRef } from "react";
import { RiResetLeftFill } from "react-icons/ri";
import { subjectOptions, termOptions, termToIcon } from "@utils/exploreFilters";
import { useExploreStore } from "src/store/useExploreStore";

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
  menuPortal: (base: any) => ({ ...base, zIndex: 100 }),
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
  onToggle: (value: string) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  icon,
  value,
  isSelected,
  onToggle,
}) => {
  return (
    <Button
      label={value}
      onClick={() => onToggle(value)}
      type={isSelected ? "primary" : "secondary"}
      icon={icon}
    />
  );
};

export const InstructorExploreFilter: React.FC = () => {
  const selectInputRef = useRef<SelectInstance<any>>(null);

  const instructorSubjects = useExploreStore(
    (state) => state.instructorSubjects
  );
  const setInstructorSubjects = useExploreStore(
    (state) => state.setInstructorSubjects
  );
  const instructorTerms = useExploreStore((state) => state.instructorTerms);
  const setInstructorTerms = useExploreStore(
    (state) => state.setInstructorTerms
  );
  const instructorMinReviews = useExploreStore(
    (state) => state.instructorMinReviews
  );
  const setInstructorMinReviews = useExploreStore(
    (state) => state.setInstructorMinReviews
  );
  const resetInstructorFilters = useExploreStore(
    (state) => state.resetInstructorFilters
  );

  const toggleArrayItem = (
    array: string[],
    item: string,
    setter: (val: string[]) => void
  ) => {
    if (array.includes(item)) {
      setter(array.filter((v) => v !== item));
    } else {
      setter([...array, item]);
    }
  };

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
              resetInstructorFilters();
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
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : null
          }
          value={subjectOptions.filter(
            (option: { value: string; label: string }) =>
              instructorSubjects.includes(option.value)
          )}
          onChange={(e) => {
            const selectedSubjects = [];
            for (const subject of e.values()) {
              selectedSubjects.push(subject.value);
            }
            setInstructorSubjects(selectedSubjects);
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
                isSelected={instructorTerms.includes(term)}
                onToggle={(val) =>
                  toggleArrayItem(instructorTerms, val, setInstructorTerms)
                }
                icon={termToIcon(term.split(" ")[0])}
              />
            );
          })}
        </div>
      </section>
      <section className="explore-filter__section">
        <p>
          <b>Reviews</b>
        </p>
        <div className="explore-filter__slider-container">
          {(() => {
            const reviewValues = [0, 1, 5, 10, 20, 50, 75, 100, 200, 300, 500];
            const currentIndex =
              instructorMinReviews === 0
                ? 0
                : reviewValues.indexOf(instructorMinReviews) !== -1
                ? reviewValues.indexOf(instructorMinReviews)
                : 0;
            return (
              <>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={currentIndex}
                  onChange={(e) => {
                    const index = Number(e.target.value);
                    setInstructorMinReviews(reviewValues[index]);
                  }}
                  className="explore-filter__slider"
                />
                <div className="explore-filter__slider-labels">
                  <span>
                    {instructorMinReviews === 0
                      ? "All"
                      : `≥${instructorMinReviews}`}
                  </span>
                  <span>500+</span>
                </div>
              </>
            );
          })()}
        </div>
      </section>
    </div>
  );
};

export default InstructorExploreFilter;
