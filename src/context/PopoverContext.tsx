import React, { createContext, useContext, useState, ReactNode } from "react";

interface PopoverContextType {
  activePopoverId: string | null;
  setActivePopoverId: (id: string | null) => void;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

export const PopoverProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

  return (
    <PopoverContext.Provider value={{ activePopoverId, setActivePopoverId }}>
      {children}
    </PopoverContext.Provider>
  );
};

export const usePopover = (): PopoverContextType => {
  const context = useContext(PopoverContext);
  if (context === undefined) {
    throw new Error("usePopover must be used within a PopoverProvider");
  }
  return context;
};

export default PopoverContext;
