import React, { useMemo } from "react";
import { CourseWithSectionDetails } from "@types";
import { TextBadge } from "./TextBadge";
import {
  calculateScheduleInsights,
  ScheduleInsights as ScheduleInsightsData,
} from "@utils/scheduleCalculation";
import {
  MdBarChart,
  MdAccessTime,
  MdTrendingUp,
  MdWbSunny,
  MdBrightness3,
  MdDirectionsCar,
} from "react-icons/md";
import { FaStar, FaBrain } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL, INSTRUCTOR_RMP_NAME_MAPPING } from "@const";

interface InstructorReviewSummary {
  URL: string;
  Quality: string;
  Ratings: string;
  Name: string;
  WouldTakeAgain: string;
  Difficulty: string;
  Department: string;
}

interface ScheduleInsightsProps {
  coursesWithSections: CourseWithSectionDetails[];
}

const formatDisplayTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, "0")}`;
};

const formatInsightTime = (minutes: number | null): string => {
  if (minutes === null) return "N/A";
  return formatDisplayTime(minutes);
};

const CustomTooltip = ({ id, content }: { id: string; content: string }) => (
  <Tooltip
    id={id}
    place="top"
    style={{
      backgroundColor: "var(--colour-neutral-900)",
      color: "var(--colour-neutral-100)",
      fontSize: "0.85rem",
      maxWidth: "300px",
      zIndex: 1000,
    }}
  >
    {content}
  </Tooltip>
);

const InsightRow = ({
  icon: Icon,
  text,
  value,
  tooltipId,
  tooltipContent,
}: {
  icon: React.ElementType;
  text: string;
  value: string;
  tooltipId?: string;
  tooltipContent?: string;
}) => (
  <div className="insight-row">
    <Icon className="insight-icon" />
    <span
      className="insight-text"
      data-tooltip-id={tooltipId}
      data-tooltip-html={tooltipContent}
    >
      {text}
    </span>
    <span className="insight-value">{value}</span>
  </div>
);

const InsightsList = ({
  insights,
  avgInstructorRating,
  avgInstructorDifficulty,
}: {
  insights: ScheduleInsightsData;
  avgInstructorRating: number | null;
  avgInstructorDifficulty: number | null;
}) => (
  <div className="insights-list">
    <InsightRow
      icon={MdBarChart}
      text="Max daily hours"
      value={`${insights.maxHours}h`}
    />
    <InsightRow
      icon={MdAccessTime}
      text="Avg daily hours"
      value={`${insights.averageDailyHours}h`}
    />
    <InsightRow
      icon={MdTrendingUp}
      text="Total weekly hours"
      value={`${insights.totalHours}h`}
    />
    <InsightRow
      icon={MdWbSunny}
      text="Earliest start"
      value={formatInsightTime(insights.earliestTime)}
    />
    <InsightRow
      icon={MdBrightness3}
      text="Latest end"
      value={formatInsightTime(insights.latestTime)}
    />
    <InsightRow
      icon={MdDirectionsCar}
      text="Commute factor"
      value={`${insights.commuteFactor}x`}
      tooltipId="commute-tooltip"
      tooltipContent="Commute factor calculation:<br/>• 1 campus = 2x (home→campus→home)<br/>• 2+ campuses = number of campuses + 1<br/>• Lower is better"
    />
    {avgInstructorRating !== null && (
      <InsightRow
        icon={FaStar}
        text="Avg instructor rating"
        value={avgInstructorRating.toFixed(1)}
        tooltipId="rating-tooltip"
        tooltipContent="Average instructor rating from RateMyProfessors<br/>• Based on all instructors in selected courses<br/>• Scale: 1.0 - 5.0"
      />
    )}
    {avgInstructorDifficulty !== null && (
      <InsightRow
        icon={FaBrain}
        text="Avg instructor difficulty"
        value={avgInstructorDifficulty.toFixed(1)}
        tooltipId="difficulty-tooltip"
        tooltipContent="Average instructor difficulty from RateMyProfessors<br/>• Based on all instructors in selected courses<br/>• Scale: 1.0 (easy) - 5.0 (hard)"
      />
    )}
  </div>
);

export const ScheduleInsights: React.FC<ScheduleInsightsProps> = ({
  coursesWithSections,
}) => {
  const { data: instructorReviewsData } = useQuery({
    queryKey: ["instructorReviews"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/reviews/instructors`);
      return res.json() as Promise<InstructorReviewSummary[]>;
    },
    staleTime: 60 * 60 * 1000,
  });

  const { avgInstructorRating, avgInstructorDifficulty } = useMemo(() => {
    if (!instructorReviewsData || coursesWithSections.length === 0) {
      return { avgInstructorRating: null, avgInstructorDifficulty: null };
    }

    const instructorNames = new Set<string>();
    coursesWithSections.forEach((course) => {
      course.sections.forEach((section) => {
        section.instructors.forEach((instructor) => {
          instructorNames.add(instructor.name);
        });
      });
    });

    const instructorRatings: number[] = [];
    const instructorDifficulties: number[] = [];

    instructorNames.forEach((name) => {
      let reviewData = instructorReviewsData.find(
        (review) => review.Name.toLowerCase() === name.toLowerCase()
      );

      if (INSTRUCTOR_RMP_NAME_MAPPING[name]) {
        const mappedName = INSTRUCTOR_RMP_NAME_MAPPING[name];
        reviewData = instructorReviewsData.find(
          (review) => review.Name.toLowerCase() === mappedName.toLowerCase()
        );
      }

      if (reviewData) {
        const rating = parseFloat(reviewData.Quality);
        const difficulty = parseFloat(reviewData.Difficulty);
        if (!isNaN(rating)) {
          instructorRatings.push(rating);
        }
        if (!isNaN(difficulty)) {
          instructorDifficulties.push(difficulty);
        }
      }
    });

    const avgRating =
      instructorRatings.length > 0
        ? instructorRatings.reduce((sum, r) => sum + r, 0) /
          instructorRatings.length
        : null;
    const avgDifficulty =
      instructorDifficulties.length > 0
        ? instructorDifficulties.reduce((sum, d) => sum + d, 0) /
          instructorDifficulties.length
        : null;

    return {
      avgInstructorRating: avgRating,
      avgInstructorDifficulty: avgDifficulty,
    };
  }, [coursesWithSections, instructorReviewsData]);

  if (coursesWithSections.length === 0) {
    return null;
  }

  const insights = calculateScheduleInsights(coursesWithSections);
  const qualityClass =
    insights.qualityScore >= 90
      ? "quality-excellent"
      : insights.qualityScore >= 80
      ? "quality-good"
      : insights.qualityScore >= 70
      ? "quality-fair"
      : insights.qualityScore >= 60
      ? "quality-poor"
      : "quality-very-poor";

  return (
    <div className="schedule-insights-compact">
      <div className="insights-header">
        <span className="insights-title">
          Summary
          <IoIosInformationCircleOutline
            className="info-icon"
            data-tooltip-id="info-tooltip"
            data-tooltip-html="To achieve a good score:<br/>• Schedule classes between 9 AM - 5 PM<br/>• Limit daily hours to 6 or less<br/>• Minimize campus transitions"
          />
        </span>
        <div
          data-tooltip-id="quality-tooltip"
          data-tooltip-html={`<div>${insights.qualityReasoning
            .split(" • ")
            .join("<br/>• ")}</div>`}
        >
          <TextBadge
            content={`${insights.qualityLabel} (${insights.qualityScore}%)`}
            className={`schedule-quality-badge ${qualityClass}`}
            enableBgColor={false}
          />
        </div>
      </div>
      <InsightsList
        insights={insights}
        avgInstructorRating={avgInstructorRating}
        avgInstructorDifficulty={avgInstructorDifficulty}
      />
      <CustomTooltip id="quality-tooltip" content={insights.qualityReasoning} />
      <CustomTooltip
        id="commute-tooltip"
        content="Commute factor calculation:<br/>• 1 campus = 2x (home→campus→home)<br/>• 2+ campuses = number of campuses + 1<br/>• Lower is better"
      />
      <CustomTooltip
        id="info-tooltip"
        content="To achieve a good score:<br/>• Schedule classes between 9 AM - 5 PM<br/>• Limit daily hours to 6 or less<br/>• Minimize campus transitions"
      />
      <CustomTooltip
        id="time-blocking-tooltip"
        content="Tap start and end time to create a time block. Tap an existing block to remove it."
      />
      <CustomTooltip
        id="rating-tooltip"
        content="Average instructor rating from RateMyProfessors<br/>• Based on all instructors in selected courses<br/>• Scale: 1.0 - 5.0"
      />
      <CustomTooltip
        id="difficulty-tooltip"
        content="Average instructor difficulty from RateMyProfessors<br/>• Based on all instructors in selected courses<br/>• Scale: 1.0 (easy) - 5.0 (hard)"
      />
    </div>
  );
};
