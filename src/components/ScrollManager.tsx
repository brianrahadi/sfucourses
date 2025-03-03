import React, { useEffect } from "react";

/**
 * ScrollManager component helps manage scroll behavior when popovers are active
 * It prevents page scrolling when a popover is open for better user experience
 */
interface ScrollManagerProps {
  isPopoverActive: boolean;
}

const ScrollManager: React.FC<ScrollManagerProps> = ({ isPopoverActive }) => {
  useEffect(() => {
    if (isPopoverActive) {
      // Save the current scroll position
      const scrollY = window.scrollY;

      // Disable scrolling on the body
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // Re-enable scrolling and restore position when component unmounts
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isPopoverActive]);

  // This component doesn't render anything
  return null;
};

export default ScrollManager;
