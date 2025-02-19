import { useState, useEffect, SetStateAction, Dispatch } from "react";

export const useQueryParamWithFallback = <T,>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] => {
  // Helper function to get URL parameter
  const getURLParameter = (paramKey: string): string | null => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(paramKey);
  };

  // Helper function to parse stored value
  const parseStoredValue = (value: string): T | null => {
    try {
      return value as T;
    } catch (error) {
      console.log("Error parsing stored value:", error);
      return null;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      // First, check URL parameters
      const urlValue = getURLParameter(key);
      if (urlValue !== null) {
        const parsedURLValue = parseStoredValue(urlValue);
        if (parsedURLValue !== null) {
          return parsedURLValue;
        }
      }

      // Then, check localStorage
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsedStorageValue = parseStoredValue(item);
        if (parsedStorageValue !== null) {
          return parsedStorageValue;
        }
      }

      // Finally, fall back to initial value
      return initialValue;
    } catch (error) {
      console.log("Error reading from storage:", error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.log("Error writing to localStorage:", error);
      }
    }
  }, [key, storedValue]);

  // Update URL when value changes (optional - uncomment if needed)
  /*
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        params.set(key, JSON.stringify(storedValue));
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}?${params.toString()}`
        );
      } catch (error) {
        console.log("Error updating URL:", error);
      }
    }
  }, [key, storedValue]);
  */

  return [storedValue, setStoredValue];
};

// Example usage:
// const [value, setValue] = useURIAndLocalStorage<string>("theme", "light");
