// SearchBar.tsx
import { Search } from "react-feather";

interface SearchBarProps {
  handleInputChange: (value: string) => void;
  iconStyle?: string;
  inputStyle?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  outerIconStyle?: string;
  outerInputStyle?: string;
  placeholder?: string;
  searchSelected: boolean;
  setSearchSelected: (value: boolean) => void;
  value?: string;
}

export const SearchBar = ({
  handleInputChange,
  inputStyle,
  onKeyDown,
  outerInputStyle,
  placeholder,
  searchSelected,
  setSearchSelected,
  value,
}: SearchBarProps) => {
  return (
    <div className="search-bar">
      <div className={`search-bar__icon-wrapper`}>
        <Search
          size={20}
          className={`search-bar__icon ${
            searchSelected ? "search-bar__icon--selected" : ""
          } ${""}`}
          aria-hidden="true"
        />
      </div>
      <div className={`search-bar__input-wrapper ${outerInputStyle || ""}`}>
        <input
          className={`search-bar__input ${inputStyle || ""}`}
          onBlur={() => setTimeout(() => setSearchSelected(false), 100)}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setSearchSelected(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          spellCheck="false"
          type="text"
          value={value}
        />
      </div>
    </div>
  );
};
