import Select, { SelectInstance } from "react-select";
import { Button } from "@components";
import { SearchBar } from "@components";
import { useRef } from "react";
import { RiResetLeftFill } from "react-icons/ri";
import { MdClose } from "react-icons/md";
import {
  deliveryOptions,
  levelOptions,
  designationOptions,
  termOptions,
  termToIcon,
} from "@utils/exploreFilters";
import { subjectOptions } from "@utils/exploreFilters";
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

export const ExploreFilter: React.FC<{
  simplified?: boolean;
  onClose?: () => void;
}> = ({ simplified = false, onClose }) => {
  const courseSubjectSelectInputRef = useRef<SelectInstance<any>>(null);

  const courseSubjects = useExploreStore((state) => state.courseSubjects);
  const setCourseSubjects = useExploreStore((state) => state.setCourseSubjects);
  const courseLevels = useExploreStore((state) => state.courseLevels);
  const setCourseLevels = useExploreStore((state) => state.setCourseLevels);
  const courseTerms = useExploreStore((state) => state.courseTerms);
  const setCourseTerms = useExploreStore((state) => state.setCourseTerms);
  const courseDeliveries = useExploreStore((state) => state.courseDeliveries);
  const setCourseDeliveries = useExploreStore(
    (state) => state.setCourseDeliveries
  );

  const coursePrereqSearchQuery = useExploreStore(
    (state) => state.coursePrereqSearchQuery
  );
  const setCoursePrereqSearchQuery = useExploreStore(
    (state) => state.setCoursePrereqSearchQuery
  );
  const searchSelected = useExploreStore((state) => state.searchSelected);
  const setSearchSelected = useExploreStore((state) => state.setSearchSelected);
  const coursePrereqIsShown = useExploreStore(
    (state) => state.coursePrereqIsShown
  );
  const setCoursePrereqIsShown = useExploreStore(
    (state) => state.setCoursePrereqIsShown
  );
  const coursePrereqHasNone = useExploreStore(
    (state) => state.coursePrereqHasNone
  );
  const setCoursePrereqHasNone = useExploreStore(
    (state) => state.setCoursePrereqHasNone
  );

  const courseDesignations = useExploreStore(
    (state) => state.courseDesignations
  );
  const setCourseDesignations = useExploreStore(
    (state) => state.setCourseDesignations
  );
  const courseMinReviews = useExploreStore((state) => state.courseMinReviews);
  const setCourseMinReviews = useExploreStore(
    (state) => state.setCourseMinReviews
  );

  const resetCourseFilters = useExploreStore(
    (state) => state.resetCourseFilters
  );

  const onReset = () => {
    courseSubjectSelectInputRef.current?.clearValue();
    resetCourseFilters();
  };

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
          <div style={{ display: "flex", gap: "4px" }}>
            <Button
              className="explore-filter__reset secondary"
              label={<RiResetLeftFill />}
              onClick={onReset}
            />
            {onClose && (
              <Button
                className="explore-filter__reset secondary"
                label={<MdClose />}
                onClick={onClose}
              />
            )}
          </div>
        </div>
        <Select
          ref={courseSubjectSelectInputRef}
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
              courseSubjects.includes(option.value)
          )}
          onChange={(e) => {
            const selectedSubjects = [];
            for (const subject of e.values()) {
              selectedSubjects.push(subject.value);
            }
            setCourseSubjects(selectedSubjects);
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
                isSelected={courseLevels.includes(level)}
                onToggle={(val) =>
                  toggleArrayItem(courseLevels, val, setCourseLevels)
                }
              />
            );
          })}
        </div>
      </section>
      {!simplified && (
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
                  isSelected={courseTerms.includes(term)}
                  onToggle={(val) =>
                    toggleArrayItem(courseTerms, val, setCourseTerms)
                  }
                  icon={termToIcon(term.split(" ")[0])}
                />
              );
            })}
          </div>
        </section>
      )}
      {!simplified && (
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
                  isSelected={courseDeliveries.includes(delivery)}
                  onToggle={(val) =>
                    toggleArrayItem(courseDeliveries, val, setCourseDeliveries)
                  }
                />
              );
            })}
          </div>
        </section>
      )}
      {!simplified && (
        <section className="explore-filter__section">
          <p>
            <b>Requirements</b>
          </p>
          <SearchBar
            placeholder="prerequisites"
            className="secondary"
            handleInputChange={setCoursePrereqSearchQuery}
            searchSelected={searchSelected}
            setSearchSelected={setSearchSelected}
            value={coursePrereqSearchQuery}
            disabled={coursePrereqHasNone}
            disabledPlaceholder="no prerequisite"
          />
          <div className="explore-filter__section__row">
            <input
              className="checkbox"
              type="checkbox"
              name="show-prereq"
              id="show-prereq"
              checked={coursePrereqIsShown}
              onChange={() => setCoursePrereqIsShown(!coursePrereqIsShown)}
            />
            <label htmlFor="show-prereq">Show prerequisites</label>
          </div>
          <div className="explore-filter__section__row">
            <input
              className="checkbox"
              type="checkbox"
              name="no-prereq"
              id="no-prereq"
              checked={coursePrereqHasNone}
              onChange={() => setCoursePrereqHasNone(!coursePrereqHasNone)}
            />
            <label htmlFor="no-prereq">No prerequisite</label>
          </div>
        </section>
      )}
      {!simplified && (
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
                  isSelected={courseDesignations.includes(designation)}
                  onToggle={(val) =>
                    toggleArrayItem(
                      courseDesignations,
                      val,
                      setCourseDesignations
                    )
                  }
                />
              );
            })}
          </div>
        </section>
      )}
      {!simplified && (
        <section className="explore-filter__section">
          <p>
            <b>Reviews</b>
          </p>
          <div className="explore-filter__slider-container">
            {(() => {
              const reviewValues = [
                0, 1, 5, 10, 20, 50, 75, 100, 200, 300, 500,
              ];
              const currentIndex =
                courseMinReviews === 0
                  ? 0
                  : reviewValues.indexOf(courseMinReviews) !== -1
                  ? reviewValues.indexOf(courseMinReviews)
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
                      setCourseMinReviews(reviewValues[index]);
                    }}
                    className="explore-filter__slider"
                  />
                  <div className="explore-filter__slider-labels">
                    <span>
                      {courseMinReviews === 0 ? "All" : `≥${courseMinReviews}`}
                    </span>
                    <span>500+</span>
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}
    </div>
  );
};

export default ExploreFilter;
