/**
 * Fetch JSON from the SFU Courses API. Caching is handled by Vercel's CDN
 * (see Cache-Control in pages/api/proxy.ts) and Next.js ISR.
 */
export async function fetchFromApi(url: string) {
  const response = await fetch(url, {
    headers: {
      "Accept-Encoding": "gzip, deflate, br",
    },
  });

  if (!response.ok) {
    throw new Error(`External API error: ${response.status}`);
  }

  return response.json();
}
