import { Dispatch, SetStateAction } from "react";
import { Course, Department } from "../types/course";
import {
  CourseOutline,
  CourseOutlineWithSectionDetails,
  CourseWithSectionDetails,
  SectionDetail,
  SectionInfo,
} from "@types";
import pako from "pako"; // For gzip decompression
import { createHash } from "crypto";

export function getDarkColorFromHash(input: string): string {
  const hash = createHash("sha256").update(input).digest("hex");

  const hex = hash.substring(0, 6);

  const r = parseInt(hex.substring(0, 2), 16) % 128; // Limit to 0-127
  const g = parseInt(hex.substring(2, 4), 16) % 128;
  const b = parseInt(hex.substring(4, 6), 16) % 128;

  const darkHexColor = `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  return darkHexColor;
}

export function formatTime(hour: number, minute: number = 0): string {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(
  date: string | Date,
  withYear: boolean = false
) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
  });
}

export function capitalize(str: string) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

export function numberWithCommas(str: number) {
  return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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

    const data = await decompressGzip(response);
    setData(data);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error; // Re-throw to allow caller to handle errors
  }
}

export async function getCourseAPIData(queryString: string): Promise<any> {
  const url = `${BASE_URL}${queryString}`;

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

    return await decompressGzip(response);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error; // Re-throw to allow caller to handle errors
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
  const json: Department[] = await getCourseAPIData(`${year}/${term}`);
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

// Advanced Utils
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
    (new Date().getFullYear() + (currentTerm === "Fall" ? 1 : 0));
  return [currentTerm, nextTerm];
}

// export function getCurrentAndNextTerm() {
//   const month = 12;
//   const terms = ["Spring", "Summer", "Fall"];
//   const currentTerm = terms[Math.floor((month - 1) / 4) % 3] + " " + 2024;
//   const nextTerm =
//     terms[(terms.indexOf(currentTerm.split(" ")[0]) + 1) % 3] +
//     " " +
//     (2025 + (currentTerm === "Fall" ? 1 : 0));
//   return [currentTerm, nextTerm];
// }

// Spring 2025 to 2025-spring
export function toTermCode(term: string) {
  return term.toLowerCase().split(" ").reverse().join("-");
}
// Constants
// export const BASE_URL = "http://localhost:8080/v1/rest";
export const BASE_URL = "https://api.sfucourses.com/v1/rest";

export const SUBJECTS = [
  "ACMA",
  "ALS",
  "APMA",
  "ARAB",
  "ARCH",
  "BISC",
  "BPK",
  "BUS",
  "CA",
  "CENV",
  "CHEM",
  "CHIN",
  "CMNS",
  "CMPT",
  "COGS",
  "CRIM",
  "DATA",
  "DIAL",
  "DMED",
  "EASC",
  "ECO",
  "ECON",
  "EDPR",
  "EDUC",
  "ENGL",
  "ENSC",
  "ENV",
  "EVSC",
  "FAL",
  "FAN",
  "FASS",
  "FEP",
  "FREN",
  "GA",
  "GEOG",
  "GERM",
  "GERO",
  "GRAD",
  "GRK",
  "GSWS",
  "HIST",
  "HSCI",
  "HUM",
  "IAT",
  "INDG",
  "INLG",
  "INS",
  "IS",
  "ITAL",
  "JAPN",
  "LANG",
  "LBRL",
  "LBST",
  "LING",
  "LS",
  "MACM",
  "MASC",
  "MATH",
  "MBB",
  "MSE",
  "NEUR",
  "NUSC",
  "ONC",
  "PERS",
  "PHIL",
  "PHYS",
  "PLAN",
  "PLCY",
  "POL",
  "PORT",
  "PSYC",
  "PUB",
  "PUNJ",
  "REM",
  "SA",
  "SCI",
  "SD",
  "SDA",
  "SEE",
  "SPAN",
  "STAT",
  "TEKX",
  "UGRAD",
  "URB",
  "WL",
];
