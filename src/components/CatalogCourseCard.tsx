import React from "react";

export interface CatalogCourseCardProps {
  id: string;
  title: string;
  credits: number | string;
  term?: string;
  onRemove: () => void;
  accentColor?: "green" | "blue" | "grey";
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isSkeleton?: boolean;
}

export const CatalogCourseCard: React.FC<CatalogCourseCardProps> = ({
  id,
  title,
  credits,
  term,
  onRemove,
  accentColor,
  draggable,
  onDragStart,
  onDragEnd,
  isSkeleton,
}) => {
  if (isSkeleton) {
    return (
      <div className={`catalog-course-card skeleton ${accentColor || ""}`}>
        <div className="course-name">{title}</div>
        <div className="course-code">{id}</div>
        <div className="course-details">
          {Number(credits) || 0} cr {term ? `• ${term}` : ""}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`catalog-course-card ${accentColor || ""} ${
        draggable ? "draggable" : ""
      }`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <button className="remove-btn" onClick={onRemove}>
        ✕
      </button>
      <div className="course-name">{title}</div>
      <div className="course-code">{id}</div>
      <div className="course-details">
        {Number(credits) || 0} cr {term ? `• ${term}` : ""}
      </div>
    </div>
  );
};
