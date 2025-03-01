import React from "react";
import html2canvas from "html2canvas";
import { FaImage } from "react-icons/fa";
import toast from "react-hot-toast";

interface ScheduleScreenshotProps {
  hasSelectedCourses: boolean;
}

export const CopyScheduleButton: React.FC<ScheduleScreenshotProps> = ({
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

      const buttonGroup = document.querySelector(".utility-button-group");
      let parentElement = null;
      let watermarkElement = null;

      // Save reference to the parent and the button's position
      if (buttonGroup && scheduleElement.contains(buttonGroup)) {
        parentElement = buttonGroup.parentElement;

        // Create a replacement element with "sfucourses.com" text that mimics the utility-button-group
        watermarkElement = document.createElement("div");
        watermarkElement.className = "utility-button-group-placeholder";
        watermarkElement.textContent = "sfucourses.com";
        watermarkElement.style.fontSize = "2rem";
        watermarkElement.style.fontWeight = "bold";
        watermarkElement.style.color = "#24a98b";
        watermarkElement.style.display = "flex";
        watermarkElement.style.alignItems = "center";
        watermarkElement.style.justifyContent = "center";

        parentElement?.removeChild(buttonGroup);
        parentElement?.appendChild(watermarkElement);
      }

      const canvas = await html2canvas(scheduleElement as HTMLElement, {
        backgroundColor: "#141515", // --color-neutral-1200
        scale: 2, // Higher scale for better quality
        logging: false,
        allowTaint: true,
        useCORS: true,
      });

      // Remove the placeholder and add the button group back after capture
      if (
        watermarkElement &&
        parentElement &&
        parentElement.contains(watermarkElement)
      ) {
        parentElement.removeChild(watermarkElement);
      }

      if (buttonGroup && parentElement) {
        parentElement.appendChild(buttonGroup);
      }

      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error("Failed to create image blob");
          return;
        }

        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          toast.success("Schedule copied as image!");
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
      className="utility-button screenshot-button"
      onClick={captureSchedule}
      disabled={!hasSelectedCourses}
      title="Copy schedule as image to clipboard"
    >
      <FaImage />
      &nbsp; Copy Image
    </button>
  );
};
