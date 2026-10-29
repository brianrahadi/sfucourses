import React from "react";

/**
 * A small bar chart in plain HTML/CSS for the 1–5 rating and difficulty
 * distributions. Replaces Recharts here: it renders fully on the server (no
 * measuring before it can draw) and ships no charting library.
 */

export interface MiniBarDatum {
  label: string | number;
  count: number;
}

interface MiniBarChartProps {
  data: MiniBarDatum[];
  /** Total used for the percentage in each bar's hover label. */
  total: number;
  colour: string;
  height?: number;
  fontSize?: number;
  /** Show y-axis tick labels (used in the larger hover charts). */
  showYAxis?: boolean;
  /** Max bar width in px, like Recharts' barSize. */
  barSize?: number;
  ariaLabel?: string;
}

const GRID_LINES = 4;

/** Rounds up to a "nice" axis maximum with four even steps, like Recharts. */
export function niceMax(value: number): number {
  if (value <= 0) return GRID_LINES;
  const step = value / GRID_LINES;
  const magnitude = 10 ** Math.floor(Math.log10(step));
  const nice =
    [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(
      (m) => m * magnitude >= step
    ) ?? 10;
  return Math.max(GRID_LINES, nice * magnitude * GRID_LINES);
}

export const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  total,
  colour,
  height = 150,
  fontSize = 12,
  showYAxis = false,
  barSize = 30,
  ariaLabel,
}) => {
  const max = niceMax(Math.max(0, ...data.map((d) => d.count)));
  const ticks = Array.from(
    { length: GRID_LINES + 1 },
    (_, i) => (max / GRID_LINES) * (GRID_LINES - i)
  );

  return (
    <div
      className={`mini-bar-chart${showYAxis ? " with-y-axis" : ""}`}
      style={{ height, fontSize }}
      role="img"
      aria-label={
        ariaLabel ?? data.map((d) => `${d.label}: ${d.count}`).join(", ")
      }
    >
      {showYAxis && (
        <div className="mini-bar-chart__y-axis" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t}>{Number.isInteger(t) ? t : t.toFixed(1)}</span>
          ))}
        </div>
      )}
      <div className="mini-bar-chart__body">
        <div className="mini-bar-chart__plot" data-bones-block>
          {ticks.slice(0, -1).map((t, i) => (
            <span
              key={t}
              className="mini-bar-chart__grid-line"
              style={{ top: `${(i / GRID_LINES) * 100}%` }}
              aria-hidden="true"
            />
          ))}
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
            return (
              <div key={d.label} className="mini-bar-chart__column">
                <div
                  className="mini-bar-chart__bar"
                  style={{
                    height: `${(d.count / max) * 100}%`,
                    maxWidth: barSize,
                    background: colour,
                  }}
                />
                <span className="mini-bar-chart__tip">
                  {d.count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
        <div className="mini-bar-chart__x-axis" aria-hidden="true">
          {data.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MiniBarChart;
