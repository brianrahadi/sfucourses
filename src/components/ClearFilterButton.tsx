import React from "react";
import { MdClear } from "react-icons/md";
import toast from "react-hot-toast";

interface ClearFilterButtonProps {
  hasFiltersApplied: boolean;
  onClearFilters: () => void;
}

export const ClearFilterButton: React.FC<ClearFilterButtonProps> = ({
  hasFiltersApplied,
  onClearFilters,
}) => {
  const handleClearFilters = () => {
    onClearFilters();
    toast.success("Filters cleared!");
  };

  return (
    <button
      className="utility-button"
      onClick={handleClearFilters}
      disabled={!hasFiltersApplied}
      title="Clear all filters"
    >
      <MdClear />
      &nbsp; Clear Filters
    </button>
  );
};
