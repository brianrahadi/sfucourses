import { Dispatch, SetStateAction } from "react";
import { CourseWithSectionDetails } from "@types";
import pako from "pako"; // For gzip decompression
import { BASE_URL } from "@const";

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
