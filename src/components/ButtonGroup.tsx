import React, { Dispatch, SetStateAction, useState } from "react";
import Button from "./Button"; // Adjust the import path as necessary

interface ButtonGroupProps<T> {
  options: T[];
  onSelect: Dispatch<SetStateAction<T>>;
  selectedOption: T;
  className?: string;
}

export const ButtonGroup = <T,>({
  options,
  onSelect,
  selectedOption,
  className,
}: ButtonGroupProps<T>): JSX.Element => {
  return (
    <div className={`button-group ${className}`}>
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
