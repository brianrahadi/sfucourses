import React, { useState, useEffect, useRef } from "react";

export interface OutlineOption {
  dept: string;
  number: string;
  title: string;
  units: number;
}

export interface CourseComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: OutlineOption[];
  placeholder?: string;
}

export const CourseCombobox: React.FC<CourseComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = "e.g. CMPT 225",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<OutlineOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (v.trim()) {
      const q = v.toLowerCase().replace(/\s/g, "");
      setFilteredOptions(
        options
          .filter(
            (o) =>
              `${o.dept}${o.number}`.toLowerCase().includes(q) ||
              o.title.toLowerCase().includes(q)
          )
          .slice(0, 50)
      );
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelectCourse = (course: OutlineOption) => {
    onChange(`${course.dept.toUpperCase()} ${course.number}`);
    setShowDropdown(false);
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value) setShowDropdown(true);
        }}
        autoComplete="off"
      />
      {showDropdown && filteredOptions.length > 0 && (
        <ul className="autocomplete-dropdown">
          {filteredOptions.map((o, idx) => (
            <li
              key={`${o.dept}-${o.number}-${idx}`}
              onClick={() => handleSelectCourse(o)}
            >
              <span className="course-code">
                {o.dept.toUpperCase()} {o.number}
              </span>{" "}
              <span className="course-title">- {o.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
