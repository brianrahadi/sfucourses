import { useRouter } from "next/router";
import {
  Dispatch,
  MouseEventHandler,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { DescriptiveSection, Section } from "types/course";
import { loadData, loadMultipleData } from "utils";
// import { Course, SectionsPerTerm } from "types/course";

interface SidebarCourseProps {
  course: {
    text: string;
    value: string;
    title: string;
  };
  closeCourseShown: MouseEventHandler<HTMLSpanElement>;
}

interface SectionsPerTermProps {
  title: string;
  sectionsPerTerm: any;
}

const SectionsPerTermDisplay: React.FC<SectionsPerTermProps> = ({
  title,
  sectionsPerTerm,
}) => {
  return (
    <></>
    // <div className="course-info course-last-sections">
    //   <h2>
    //     {title} - {sectionsPerTerm.term}
    //   </h2>
    //   <div className="sections-container">
    /* {sectionsPerTerm.sections
          .filter((s) => s.info.type !== "n")
          .map((section) => {
            const instructorNames =
              section.info.instructorNames.length > 0
                ? section.info.instructorNames
                : ["Unknown"];
            return (
              <div className="section-unit" key={section.info.classNumber}>
                <p>
                  {section.info.section} - {instructorNames.join(", ")}
                </p>
                {section.info.campus !== "None" && <p>{section.info.campus}</p>}
                <ul className="schedule-list">
                  {section.courseSchedule
                    .filter((schedule) => schedule.days !== "")
                    .map((schedule) => {
                      return (
                        <li
                          key={schedule.sectionCode}
                          className="schedule-unit"
                        >
                          {schedule.days}; {schedule.startTime}-{" "}
                          {schedule.endTime}
                        </li>
                      );
                    })}
                </ul>
              </div>
            );
          })} */
    //   </div>
    // </div>
  );
};

export const SidebarCourse: React.FC<SidebarCourseProps> = ({
  course,
  closeCourseShown,
}) => {
  const router = useRouter();

  const [sections, setSections] = useState<Section[]>([]);
  const [descriptiveSections, setDescriptiveSections] = useState<
    DescriptiveSection[]
  >([]);

  const { year, term, dept, number } = router.query;

  const yearStr = Array.isArray(year) ? year[0] : year ?? "";
  const termStr = Array.isArray(term) ? term[0] : term ?? "";
  const deptStr = Array.isArray(dept) ? dept[0] : dept ?? "";
  const numberStr = Array.isArray(number) ? number[0] : number ?? "";

  useEffect(() => {
    setDescriptiveSections([]);
    loadData(`${yearStr}/${termStr}/${deptStr}/${course.value}`, setSections);
  }, [course]);

  useEffect(() => {
    if (sections.length === 0) return;
    const sectionUrls = sections.map(
      (section) =>
        `${yearStr}/${termStr}/${deptStr}/${course.value}/${section.value}`
    );
    loadMultipleData(sectionUrls, setDescriptiveSections);
  }, [sections]);

  useEffect(() => {}, [descriptiveSections]);

  if (descriptiveSections.length == 0) return <div></div>;

  return (
    <div className="sidebar-course">
      <div className="course-info">
        <p className="space-between">
          <b>
            {descriptiveSections?.[0]?.info?.dept}{" "}
            {descriptiveSections?.[0]?.info?.number} (
            {descriptiveSections?.[0]?.info?.units})
          </b>
          <span className="close-sidebar" onClick={closeCourseShown}>
            Close
          </span>
        </p>
        <h2>{descriptiveSections?.[0]?.info?.title}</h2>
        <p>{descriptiveSections?.[0]?.info?.description}</p>
        {descriptiveSections?.[0]?.info?.notes && (
          <p>{descriptiveSections[0].info.notes}</p>
        )}
        <p>
          Prerequisites:{" "}
          {descriptiveSections?.[0]?.info?.prerequisites !== ""
            ? descriptiveSections?.[0]?.info?.prerequisites
            : "None"}
        </p>
      </div>
      {/* <SectionsPerTermDisplay
        title="Last offering"
        sectionsPerTerm={course.last_sections}
      />
      {course.future_sections.sections.length > 0 ? (
        <SectionsPerTermDisplay
          title="Next offering"
          sectionsPerTerm={course.future_sections}
        />
      ) : (
        <h2>Currently not offered for {course.future_sections.term}</h2>
      )} */}
    </div>
  );
};
