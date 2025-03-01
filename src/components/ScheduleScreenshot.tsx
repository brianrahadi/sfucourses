import React from "react";
import html2canvas from "html2canvas";
import { FaImage } from "react-icons/fa";

interface ScheduleScreenshotProps {
  hasSelectedCourses: boolean;
}

export const ScheduleScreenshot: React.FC<ScheduleScreenshotProps> = ({
  hasSelectedCourses,
}) => {
  const captureSchedule = async () => {
    try {
      const scheduleElement = document.querySelector(
        ".schedule-section__content"
      );

      if (!scheduleElement) {
        console.error("Schedule element not found");
        return;
      }

      const button = document.querySelector(".screenshot-button");
      if (button) {
        button.textContent = "Capturing...";
        button.classList.add("loading");
      }

      const canvas = await html2canvas(scheduleElement as HTMLElement, {
        backgroundColor: "#141515", // --color-neutral-1200
        scale: 2, // Higher scale for better quality
        logging: false,
        allowTaint: true,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error("Failed to create image blob");
          return;
        }

        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);

          // Update button state to success
          if (button) {
            button.textContent = "Copied!";
            button.classList.remove("loading");
            button.classList.add("success");

            // Reset button after 2 seconds
            setTimeout(() => {
              button.textContent = "Copy as Image";
              button.classList.remove("success");
            }, 2000);
          }
        } catch (error) {
          console.error("Failed to copy to clipboard:", error);

          // Fallback: Create download link if clipboard API fails
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "sfu-schedule.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          if (button) {
            button.textContent = "Downloaded";
            button.classList.remove("loading");

            setTimeout(() => {
              button.textContent = "Copy as Image";
            }, 2000);
          }
        }
      }, "image/png");
    } catch (error) {
      console.error("Screenshot capture failed:", error);

      const button = document.querySelector(".screenshot-button");
      if (button) {
        button.textContent = "Failed";
        button.classList.remove("loading");
        button.classList.add("error");

        setTimeout(() => {
          button.textContent = "Copy as Image";
          button.classList.remove("error");
        }, 2000);
      }
    }
  };

  return (
    <button
      className="ical-export-button"
      onClick={captureSchedule}
      disabled={!hasSelectedCourses}
      title="Copy schedule as image to clipboard"
    >
      <FaImage />
      &nbsp; Copy as Image
    </button>
  );
};
