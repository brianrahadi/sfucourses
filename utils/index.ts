import { Dispatch, SetStateAction } from "react";
import { Course, Department } from "types/course";

export const YEAR = "2025";
export const TERM = "spring";
export const BASE_URL = "http://www.sfu.ca/bin/wcm/course-outlines";

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function capitalize(str: string) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

export async function loadData(
  queryString: string,
  setData: Dispatch<SetStateAction<any>>
): Promise<void> {
  const url = `${BASE_URL}?${queryString}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("404");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const json = await response.json();
    setData(json);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
  }
}

export async function getData(queryString: string): Promise<any> {
  const url = `${BASE_URL}?${queryString}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("404");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
  }
}

export async function loadMultipleData(
  queryStrings: string[],
  setData: Dispatch<SetStateAction<any[]>>
): Promise<void> {
  const urls = queryStrings.map((queryString) => `${BASE_URL}?${queryString}`);

  try {
    const responses = await Promise.all(urls.map((url) => fetch(url)));

    const isValidResponse = responses.every((response) => response.ok);
    if (!isValidResponse) {
      const failedIndex = responses.findIndex((response) => !response.ok);
      throw new Error(
        `Request failed for URL: ${urls[failedIndex]} with status ${responses[failedIndex].status}`
      );
    }

    const jsonData = await Promise.all(
      responses.map((response) => response.json())
    );

    setData(jsonData);
  } catch (error) {
    console.error("Error fetching multiple URLs:", error);
  }
}

export async function loadDepartmentName(
  year: string,
  term: string,
  deptValue: string,
  setDeptName: Dispatch<SetStateAction<string | null>>
): Promise<void> {
  const json: Department[] = await getData(`${year}/${term}`);
  const deptName = json.find((dept) => dept.value === deptValue)?.name;
  setDeptName(deptName?.toLowerCase() || null);
}

export function getDepartmentName(
  departments: Department[],
  deptValue: string
): string | null {
  return (
    departments.find((dept) => dept.value === deptValue)?.name.toLowerCase() ||
    null
  );
}
