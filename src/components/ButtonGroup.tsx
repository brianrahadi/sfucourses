import React, { Dispatch, SetStateAction, useState } from "react";
import Button from "./Button"; // Adjust the import path as necessary

interface ButtonGroupProps<T> {
  options: T[];
  onSelect: Dispatch<SetStateAction<T>>;
  selectedOption: T;
}

export const ButtonGroup = <T,>({
  options,
  onSelect,
  selectedOption,
}: ButtonGroupProps<T>): JSX.Element => {
  return (
    <div className="button-group">
      {options.map((option, index) => (
        <Button
          key={index}
          label={String(option)}
          type={selectedOption === option ? "primary" : "secondary"}
          onClick={() => onSelect(option)}
          className={selectedOption === option ? "selected" : ""}
        />
      ))}
    </div>
  );
};

export default ButtonGroup;
