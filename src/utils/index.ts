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

async function proxiedFetch(pathWithQuery: string) {
  const isServer = typeof window === "undefined";

  if (isServer) {
    // On the server, we can call the caching wrapper directly
    const { fetchWithCache } = await import("../lib/api-wrapper");
    return fetchWithCache(`https://api.sfucourses.com${pathWithQuery}`);
  }

  // On the client, we call the proxy API route
  const proxyUrl = `/api/proxy?path=${encodeURIComponent(pathWithQuery)}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("404");
    }
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

export async function loadCourseAPIData(
  queryString: string,
  setData: (data: any) => void
): Promise<void> {
  const path = `/v1/rest${queryString}`;

  try {
    const data = await proxiedFetch(path);
    setData(data);
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    throw error;
  }
}

export async function getCourseAPIData(
  path: string,
  params: Record<string, string> = {}
): Promise<any> {
  let pathWithParams = `/v1/rest${path}`;

  // Add parameters to URL
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, value);
  });

  const queryString = searchParams.toString();
  if (queryString) {
    pathWithParams += (pathWithParams.includes("?") ? "&" : "?") + queryString;
  }

  return proxiedFetch(pathWithParams);
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
  try {
    const data: HealthResponse = await proxiedFetch("/health");
    return data.lastDataUpdate;
  } catch (error) {
    console.error("Error fetching health data:", error);
    throw new Error("Failed to fetch health data");
  }
};
