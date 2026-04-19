import { useState, useEffect } from "react";

export const useLocalStorage = <T,>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (item as T) : initialValue;
    } catch (error) {
      console.log("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.log("Error writing to localStorage:", error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};
