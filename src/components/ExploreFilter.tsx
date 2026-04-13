import Select, { SelectInstance } from "react-select";
import { Button } from "@components";
import { SearchBar } from "@components";
import { useRef, useEffect } from "react";
import { useRouter } from "next/router";
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

  const router = useRouter();
  const isHydratedRef = useRef(false);

  // Sync state from query on initial load
  useEffect(() => {
    if (router.isReady && !isHydratedRef.current) {
      const q = router.query;
      if (q.subjects) setCourseSubjects((q.subjects as string).split(","));
      if (q.levels) setCourseLevels((q.levels as string).split(","));
      if (q.terms) setCourseTerms((q.terms as string).split(","));
      if (q.deliveries)
        setCourseDeliveries((q.deliveries as string).split(","));
      if (q.designations)
        setCourseDesignations((q.designations as string).split(","));
      if (q.prereqQuery && typeof q.prereqQuery === "string")
        setCoursePrereqSearchQuery(q.prereqQuery);
      if (q.prereqIsShown === "true") setCoursePrereqIsShown(true);
      if (q.prereqHasNone === "true") setCoursePrereqHasNone(true);
      if (q.minReviews) setCourseMinReviews(Number(q.minReviews));

      isHydratedRef.current = true;
    }
  }, [
    router.isReady,
    router.query,
    setCourseSubjects,
    setCourseLevels,
    setCourseTerms,
    setCourseDeliveries,
    setCourseDesignations,
    setCoursePrereqSearchQuery,
    setCoursePrereqIsShown,
    setCoursePrereqHasNone,
    setCourseMinReviews,
  ]);

  // Sync state to query when state changes
  useEffect(() => {
    if (!router.isReady || !isHydratedRef.current) return;

    const query = { ...router.query };

    const syncArray = (key: string, arr: string[]) => {
      if (arr.length > 0) query[key] = arr.join(",");
      else delete query[key];
    };

    syncArray("subjects", courseSubjects);
    syncArray("levels", courseLevels);
    syncArray("terms", courseTerms);
    syncArray("deliveries", courseDeliveries);
    syncArray("designations", courseDesignations);

    if (coursePrereqSearchQuery) query.prereqQuery = coursePrereqSearchQuery;
    else delete query.prereqQuery;

    if (coursePrereqIsShown) query.prereqIsShown = "true";
    else delete query.prereqIsShown;

    if (coursePrereqHasNone) query.prereqHasNone = "true";
    else delete query.prereqHasNone;

    if (courseMinReviews > 0) query.minReviews = courseMinReviews.toString();
    else delete query.minReviews;

    const keysToCheck = [
      "subjects",
      "levels",
      "terms",
      "deliveries",
      "designations",
      "prereqQuery",
      "prereqIsShown",
      "prereqHasNone",
      "minReviews",
    ];

    let changed = false;
    for (const key of keysToCheck) {
      if (query[key] !== router.query[key]) {
        changed = true;
        break;
      }
    }

    if (changed) {
      router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    }
  }, [
    router,
    router.isReady,
    router.query,
    router.pathname,
    courseSubjects,
    courseLevels,
    courseTerms,
    courseDeliveries,
    courseDesignations,
    coursePrereqSearchQuery,
    coursePrereqIsShown,
    coursePrereqHasNone,
    courseMinReviews,
  ]);

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
