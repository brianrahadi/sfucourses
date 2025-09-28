import React from "react";
import { MdClear } from "react-icons/md";
import toast from "react-hot-toast";

interface ResetFilterButtonProps {
  hasFiltersApplied: boolean;
  onResetFilters: () => void;
}

export const ResetFilterButton: React.FC<ResetFilterButtonProps> = ({
  hasFiltersApplied,
  onResetFilters,
}) => {
  const handleResetFilters = () => {
    onResetFilters();
    toast.success("Filters cleared!");
  };

  return (
    <button
      className="utility-button"
      onClick={handleResetFilters}
      disabled={!hasFiltersApplied}
      title="Reset all filters"
    >
      <MdClear />
      &nbsp; Reset Filters
    </button>
  );
};
