/**
 * Detects if the current device is a mobile or touch device
 * @returns boolean - true if mobile/touch device
 */
export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;

  // Primary check - does the device support touch?
  const hasTouchSupport =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0;

  // Secondary check - use user agent (less reliable)
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUserAgent =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(
      userAgent
    );

  // Screen size check
  const isSmallScreen = window.innerWidth < 768;

  // Return true if the device supports touch AND (has a mobile user agent OR has a small screen)
  return hasTouchSupport && (isMobileUserAgent || isSmallScreen);
};

/**
 * Detects if the device is in portrait orientation
 * @returns boolean - true if in portrait orientation
 */
export const isPortrait = (): boolean => {
  if (typeof window === "undefined") return false;

  return window.innerHeight > window.innerWidth;
};

/**
 * Gets the device type based on screen size and touch capabilities
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
export const getDeviceType = (): "mobile" | "tablet" | "desktop" => {
  if (typeof window === "undefined") return "desktop";

  const hasTouchSupport =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0;

  // Determine device type by screen width
  if (window.innerWidth <= 480) {
    return "mobile";
  } else if (window.innerWidth <= 1024 && hasTouchSupport) {
    return "tablet";
  }

  return "desktop";
};
