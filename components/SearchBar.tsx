// SearchBar.tsx
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

export const SearchBar = ({
  handleInputChange,
  onKeyDown,
  outerInputStyle,
  placeholder,
  searchSelected,
  setSearchSelected,
  value,
  className,
  disabled,
  disabledPlaceholder: disabledPlacehodler,
}: SearchBarProps) => {
  return (
    <div className={`search-bar ${className} ${disabled}`}>
      <div className={`search-bar__icon-wrapper`}>
        <Search
          size={20}
          className={`search-bar__icon ${
            searchSelected && "search-bar__icon--selected"
          }`}
          aria-hidden="true"
        />
      </div>
      <div className={`search-bar__input-wrapper ${outerInputStyle || ""}`}>
        <input
          onBlur={() => setTimeout(() => setSearchSelected(false), 100)}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setSearchSelected(true)}
          onKeyDown={onKeyDown}
          placeholder={disabled ? disabledPlacehodler : placeholder}
          spellCheck="false"
          type="text"
          value={!disabled ? value : ""}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
