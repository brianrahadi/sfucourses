import { Dispatch, SetStateAction } from "react";
import { CourseWithSectionDetails } from "@types";
import pako from "pako";
import { BASE_URL } from "@const";
import { addParameterToUrl } from "./url";
export * from "./reviewUtils";

// by default always gzip
async function decompressGzip(response: Response): Promise<any> {
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  try {
    const decompressed = pako.inflate(uint8Array, { to: "string" });
    return JSON.parse(decompressed);
  } catch (error) {
    console.error("Error decompressing/parsing response:", error);
    throw error;
  }
}

export async function loadCourseAPIData(
  queryString: string,
  setData: Dispatch<SetStateAction<any>>
): Promise<void> {
  const url = `${BASE_URL}${queryString}`;

  try {
    const response = await fetch(`${url}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("404");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    setData(response);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error; // Re-throw to allow caller to handle errors
  }
}

export async function getCourseAPIData(
  path: string,
  params: Record<string, string> = {}
): Promise<any> {
  let url = `${BASE_URL}${path}`;

  // Add parameters to URL
  Object.entries(params).forEach(([key, value]) => {
    url = addParameterToUrl(url, key, value);
  });

  try {
    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("404");
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

export function generateBaseOutlinePath(
  courseWithSectionDetails: CourseWithSectionDetails
): string {
  const { term, dept, number } = courseWithSectionDetails;

  const termPath = term.toLowerCase().split(/ /g).reverse().join("/");

  return `https://www.sfu.ca/outlines.html?${termPath}/${dept.toLowerCase()}/${number}`;
}

export function onlyUnique<T>(value: T, index: number, array: T[]) {
  return array.indexOf(value) === index;
}

export function getCurrentAndNextTerm() {
  const month = new Date().getMonth() + 1;
  const terms = ["Spring", "Summer", "Fall"];
  const currentTerm =
    terms[Math.floor((month - 1) / 4) % 3] + " " + new Date().getFullYear();
  const nextTerm =
    terms[(terms.indexOf(currentTerm.split(" ")[0]) + 1) % 3] +
    " " +
    (new Date().getFullYear() + (currentTerm.split(" ")[0] === "Fall" ? 1 : 0));
  return [currentTerm, nextTerm];
}

export function toShortenedTerm(term: string) {
  const termMap: { [key: string]: string } = {
    Spring: "sp",
    Summer: "su",
    Fall: "fa",
  };
  const [termName, year] = term.split(" ");
  return `${termMap[termName]}${year.slice(-2)}`;
}

interface HealthResponse {
  status: string;
  version: string;
  lastDataUpdate: string;
}

export const fetchLastUpdated = async (): Promise<string> => {
  const response = await fetch("https://api.sfucourses.com/health");
  if (!response.ok) {
    throw new Error("Failed to fetch health data");
  }
  const data: HealthResponse = await response.json();
  return data.lastDataUpdate;
};
