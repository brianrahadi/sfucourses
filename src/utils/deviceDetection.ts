export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;

  // Primary check - does the device support touch?
  const hasTouchSupport =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

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
