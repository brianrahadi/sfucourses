// src/components/SearchBar.tsx
import React, { forwardRef } from "react";
import { Search } from "react-feather";

interface SearchBarProps {
  handleInputChange: (value: string) => void;
  iconStyle?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  outerIconStyle?: string;
  outerInputStyle?: string;
  placeholder?: string;
  searchSelected: boolean;
  setSearchSelected: (value: boolean) => void;
  value?: string;
  className?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      handleInputChange,
      onKeyDown,
      outerInputStyle,
      placeholder,
      searchSelected,
      setSearchSelected,
      value,
      className,
      disabled,
      disabledPlaceholder,
    },
    ref
  ) => {
    return (
      <div className={`search-bar ${className} ${disabled ? "disabled" : ""}`}>
        <div className={`search-bar__icon-wrapper`}>
          <Search
            size={20}
            className={`search-bar__icon ${
              searchSelected ? "search-bar__icon--selected" : ""
            }`}
            aria-hidden="true"
          />
        </div>
        <div className={`search-bar__input-wrapper ${outerInputStyle || ""}`}>
          <input
            ref={ref}
            onBlur={() => setTimeout(() => setSearchSelected(false), 100)}
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={() => setSearchSelected(true)}
            onKeyDown={onKeyDown}
            placeholder={disabled ? disabledPlaceholder : placeholder}
            spellCheck="false"
            type="text"
            value={!disabled ? value : ""}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar"; // For React DevTools

export default SearchBar;
