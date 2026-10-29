import React from "react";
import { MiniBarChart } from "./MiniBarChart";
import { StarIcon, BrainIcon } from "./ReviewIcons";

interface ChartDataPoint {
  rating?: string | number;
  difficulty?: string | number;
  count: number;
}

interface ReviewChartsProps {
  ratingData: ChartDataPoint[];
  difficultyData: ChartDataPoint[];
  totalReviews: number;
  overallRating: number;
  overallDifficulty: number;
  height?: number;
  fontSize?: number;
}

export const ReviewCharts: React.FC<ReviewChartsProps> = ({
  ratingData,
  difficultyData,
  totalReviews,
  overallRating,
  overallDifficulty,
  height = 150,
  fontSize = 12,
}) => {
  return (
    <div className="course-charts-section">
      <div className="course-charts">
        <div className="chart-container">
          <div className="chart-header">
            <span className="chart-title">
              <StarIcon size={16} style={{ marginRight: "8px" }} />
              RATING
            </span>
            <div className="chart-score-bar rating">
              <span className="score-text">
                {overallRating.toFixed(2).replace(/\.00$/, "")}/5
              </span>
              <div className="score-bar-bg" data-bones-block>
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${(overallRating / 5) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <MiniBarChart
            data={ratingData.map((d) => ({
              label: d.rating ?? "",
              count: d.count,
            }))}
            total={totalReviews}
            colour="#f59e0b"
            height={height}
            fontSize={fontSize}
            ariaLabel="Rating distribution"
          />
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <span className="chart-title">
              <BrainIcon size={16} style={{ marginRight: "8px" }} />
              DIFFICULTY
            </span>
            <div className="chart-score-bar difficulty">
              <span className="score-text">
                {overallDifficulty.toFixed(2).replace(/\.00$/, "")}/5
              </span>
              <div className="score-bar-bg" data-bones-block>
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${(overallDifficulty / 5) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <MiniBarChart
            data={difficultyData.map((d) => ({
              label: d.difficulty ?? "",
              count: d.count,
            }))}
            total={totalReviews}
            colour="#f05f5f"
            height={height}
            fontSize={fontSize}
            ariaLabel="Difficulty distribution"
          />
        </div>
      </div>
    </div>
  );
};
