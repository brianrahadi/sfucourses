import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
              <div className="score-bar-bg">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${(overallRating / 5) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={ratingData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--colour-neutral-800)"
              />
              <XAxis
                dataKey="rating"
                stroke="var(--colour-neutral-400)"
                fontSize={fontSize}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--colour-neutral-1100)",
                  border: "1px solid var(--colour-neutral-800)",
                  borderRadius: "0.5rem",
                  color: "var(--colour-neutral-200)",
                }}
                formatter={(value: number) => {
                  if (totalReviews === 0) return [`${value} (0%)`, "Count"];
                  return [
                    `${value} (${((value / totalReviews) * 100).toFixed(0)}%)`,
                    "Count",
                  ];
                }}
                labelFormatter={() => ``}
              />
              <Bar
                dataKey="count"
                fill="#f59e0b"
                radius={[2, 2, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
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
              <div className="score-bar-bg">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${(overallDifficulty / 5) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={difficultyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--colour-neutral-800)"
              />
              <XAxis
                dataKey="difficulty"
                stroke="var(--colour-neutral-400)"
                fontSize={fontSize}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--colour-neutral-1100)",
                  border: "1px solid var(--colour-neutral-800)",
                  borderRadius: "0.5rem",
                  color: "var(--colour-neutral-200)",
                }}
                formatter={(value: number) => {
                  if (totalReviews === 0) return [`${value} (0%)`, "Count"];
                  return [
                    `${value} (${((value / totalReviews) * 100).toFixed(0)}%)`,
                    "Count",
                  ];
                }}
                labelFormatter={() => ``}
              />
              <Bar
                dataKey="count"
                fill="#f05f5f"
                radius={[2, 2, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
