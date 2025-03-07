import React from "react";
import { IoFilterOutline, IoFilterSharp } from "react-icons/io5";

interface ConflictFilterButtonProps {
  isActive: boolean;
  onClick: () => void;
}

export const ConflictFilterButton: React.FC<ConflictFilterButtonProps> = ({
  isActive,
  onClick,
}) => {
  return (
    <button
      className={`conflict-filter-button ${isActive ? "active" : ""}`}
      onClick={onClick}
      title={isActive ? "Show all courses" : "Hide courses with time conflicts"}
    >
      {isActive ? <IoFilterSharp /> : <IoFilterOutline />}
      {isActive ? "Showing conflict-free" : "Filter conflicts"}
    </button>
  );
};
