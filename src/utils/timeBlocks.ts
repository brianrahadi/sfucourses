// src/utils/timeBlocks.ts
import { TimeBlock, CourseWithSectionDetails } from "@types";
import { insertUrlParam, removeUrlParameter } from "./url";

// Extract and format timeblocks from URL parameter
export const getTimeBlocksFromUrl = (): TimeBlock[] => {
  if (typeof window === "undefined") return [];

  const searchParams = new URLSearchParams(window.location.search);
  const blocksParam = searchParams.get("timeblocks");

  if (!blocksParam) return [];

  try {
    // Format is day-startTime-duration,day-startTime-duration
    // e.g., "Mon-480-60,Wed-600-90" (Mon 8:00-9:00, Wed 10:00-11:30)
    return blocksParam.split(",").map((block) => {
      const [day, startTimeStr, durationStr] = block.split("-");
      return {
        id: `block-${Math.random().toString(36).substring(2, 11)}`,
        day,
        startTime: parseInt(startTimeStr, 10),
        duration: parseInt(durationStr, 10),
        label: "Blocked",
      };
    });
  } catch (error) {
    console.error("Error parsing timeblocks from URL", error);
    return [];
  }
};

// Serialize timeblocks to URL parameter format
export const timeBlocksToUrlParam = (blocks: TimeBlock[]): string => {
  return blocks
    .map((block) => `${block.day}-${block.startTime}-${block.duration}`)
    .join(",");
};

// Update URL with current timeblocks
export const updateTimeBlocksInUrl = (blocks: TimeBlock[]) => {
  if (blocks.length > 0) {
    insertUrlParam("timeblocks", timeBlocksToUrlParam(blocks));
  } else {
    removeUrlParameter("timeblocks");
  }
};

// Convert timeblock to course format for conflict checking
export const timeBlockToCourseFormat = (
  block: TimeBlock
): CourseWithSectionDetails => {
  // Calculate hours and minutes
  const hours = Math.floor(block.startTime / 60);
  const minutes = block.startTime % 60;
  const startTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  const endMinutes = block.startTime + block.duration;
  const endHours = Math.floor(endMinutes / 60);
  const endMinutesRemainder = endMinutes % 60;
  const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutesRemainder
    .toString()
    .padStart(2, "0")}`;

  // Day code mapping
  const dayCodeMap: Record<string, string> = {
    Mon: "Mo",
    Tue: "Tu",
    Wed: "We",
    Thu: "Th",
    Fri: "Fr",
  };

  return {
    dept: "BLOCK",
    number: block.id.substring(0, 4),
    title: "Time Block",
    units: "0",
    term: "", // Not relevant for blocks
    sections: [
      {
        section: "BLOCKED",
        classNumber: block.id,
        deliveryMethod: "In Person",
        instructors: [],
        schedules: [
          {
            startDate: new Date().toISOString().split("T")[0], // Today
            endDate: new Date(new Date().setDate(new Date().getDate() + 120))
              .toISOString()
              .split("T")[0], // 4 months ahead
            campus: "Blocked Time",
            days: dayCodeMap[block.day] || block.day,
            startTime,
            endTime,
            sectionCode: "BLOCK",
          },
        ],
      },
    ],
  };
};

/**
 * Merges overlapping time blocks on the same day
 * @param blocks Array of time blocks to merge
 * @returns New array with merged time blocks
 */
export const mergeOverlappingBlocks = (blocks: TimeBlock[]): TimeBlock[] => {
  if (blocks.length <= 1) return blocks;

  // Group blocks by day
  const blocksByDay: Record<string, TimeBlock[]> = {};

  blocks.forEach((block) => {
    if (!blocksByDay[block.day]) {
      blocksByDay[block.day] = [];
    }
    blocksByDay[block.day].push(block);
  });

  // Process each day separately
  const mergedBlocks: TimeBlock[] = [];

  Object.entries(blocksByDay).forEach(([day, dayBlocks]) => {
    // Sort blocks by start time
    const sortedBlocks = [...dayBlocks].sort(
      (a, b) => a.startTime - b.startTime
    );

    // Merge overlapping blocks
    const mergedDayBlocks: TimeBlock[] = [];
    let currentBlock = sortedBlocks[0];

    for (let i = 1; i < sortedBlocks.length; i++) {
      const nextBlock = sortedBlocks[i];
      const currentBlockEndTime =
        currentBlock.startTime + currentBlock.duration;

      // Check if blocks overlap or are adjacent
      if (nextBlock.startTime <= currentBlockEndTime) {
        // Merge the blocks
        const endTime = Math.max(
          currentBlockEndTime,
          nextBlock.startTime + nextBlock.duration
        );

        currentBlock = {
          ...currentBlock,
          duration: endTime - currentBlock.startTime,
          // Keep the original ID for easier tracking
        };
      } else {
        // No overlap, add current block to merged list and move to next
        mergedDayBlocks.push(currentBlock);
        currentBlock = nextBlock;
      }
    }

    // Add the last block
    mergedDayBlocks.push(currentBlock);
    mergedBlocks.push(...mergedDayBlocks);
  });

  return mergedBlocks;
};
