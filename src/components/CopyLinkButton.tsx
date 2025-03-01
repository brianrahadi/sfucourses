import React from "react";
import html2canvas from "html2canvas";
import { FaLink } from "react-icons/fa6";

interface ScheduleScreenshotProps {
  hasSelectedCourses: boolean;
}

export const CopyLinkButton: React.FC<ScheduleScreenshotProps> = ({
  hasSelectedCourses,
}) => {
  const copyLink = async () => {
    const item = new ClipboardItem({ "text/plain": window.location.href });
    await navigator.clipboard.write([item]);
  };

  return (
    <button
      className="utility-button"
      onClick={copyLink}
      disabled={!hasSelectedCourses}
      title="Copy URL to clipboard"
    >
      <FaLink />
      &nbsp; Copy Link
    </button>
  );
};
