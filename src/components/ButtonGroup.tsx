import React, { Dispatch, SetStateAction, useState } from "react";
import Button from "./Button"; // Adjust the import path as necessary

interface ButtonGroupProps {
  options: string[];
  onSelect: Dispatch<SetStateAction<string>>;
  selectedOption: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  options,
  onSelect,
  selectedOption,
}) => {
  return (
    <div className="button-group">
      {options.map((option) => (
        <Button
          key={option}
          label={option}
          type={selectedOption === option ? "primary" : "secondary"}
          onClick={() => onSelect(option)}
          className={selectedOption === option ? "selected" : ""}
        />
      ))}
    </div>
  );
};

export default ButtonGroup;
