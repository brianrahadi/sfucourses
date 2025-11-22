import React from "react";
import { CourseWithSectionDetails } from "@types";
import { TextBadge } from "./TextBadge";
import {
  calculateScheduleInsights,
  ScheduleInsights,
} from "@utils/scheduleCalculation";
import {
  MdBarChart,
  MdAccessTime,
  MdTrendingUp,
  MdWbSunny,
  MdBrightness3,
  MdDirectionsCar,
} from "react-icons/md";
import { Tooltip } from "react-tooltip";
import { IoIosInformationCircleOutline } from "react-icons/io";

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

const InsightsList = ({ insights }: { insights: ScheduleInsights }) => (
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
  </div>
);

export const ScheduleInsights: React.FC<ScheduleInsightsProps> = ({
  coursesWithSections,
}) => {
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
      <InsightsList insights={insights} />
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
    </div>
  );
};
