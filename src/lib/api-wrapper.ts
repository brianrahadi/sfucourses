/**
 * Origin of the SFU Courses API. Override with SFUCOURSES_API_URL (e.g.
 * http://localhost:8080) to develop against a local API.
 */
export const API_ORIGIN =
  process.env.SFUCOURSES_API_URL || "https://api.sfucourses.com";

/**
 * Fetch JSON from the SFU Courses API. Caching is handled by Vercel's CDN
 * (see Cache-Control in pages/api/proxy.ts) and Next.js ISR.
 *
 * Pass `timeoutMs` to abort a request that hangs, so callers with a fallback
 * (e.g. a bundled snapshot) can use it instead of waiting.
 */
export async function fetchFromApi(
  url: string,
  { timeoutMs }: { timeoutMs?: number } = {}
) {
  const controller = timeoutMs ? new AbortController() : undefined;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : undefined;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
      },
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (controller?.signal.aborted) {
      throw new Error(`External API timed out after ${timeoutMs}ms: ${url}`);
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
