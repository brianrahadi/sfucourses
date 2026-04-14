import { test, expect } from "@playwright/test";

const pages = [
  "/",
  "/explore",
  "/explore/acma-101",
  "/instructors/brian fraser",
  "/graph",
  "/degree",
  "/schedule",
];

for (const page of pages) {
  test(`should load ${page} successfully`, async ({ page: browserPage }) => {
    const failedApiRequests: string[] = [];
    browserPage.on("response", (response) => {
      if (response.url().includes("api.sfucourses.com") && !response.ok()) {
        failedApiRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    const response = await browserPage.goto(page);
    expect(response?.status()).toBe(200);

    // Give the page a moment to render
    await browserPage.waitForLoadState("networkidle");

    // Check there are no obvious Next.js error overlays
    const errorOverlay = browserPage.locator("nextjs-portal");
    await expect(errorOverlay).toHaveCount(0);

    // Verify no API requests failed
    expect(failedApiRequests).toEqual([]);
  });
}
