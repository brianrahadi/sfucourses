#!/usr/bin/env node
/**
 * Re-captures the skeleton bones in src/bones from the real UI.
 *
 *   npm run build && npm start     # or `npm run dev`
 *   npm run bones                  # in another terminal (default origin :3000)
 *
 * This does what `npx boneyard-js build` does, using the Playwright already in
 * devDependencies: it opens each page below with `window.__BONEYARD_BUILD`
 * set, at every width in boneyard.config.json, and snapshots each
 * `[data-boneyard]` region (<BoneRegion>) with window.__BONEYARD_SNAPSHOT
 * (src/components/bones/capture.ts). Output is boneyard's .bones.json format,
 * so the boneyard CLI can be used instead if you prefer.
 *
 * Re-run it whenever the course, instructor or explore page layout changes.
 * Set CHROMIUM_PATH to use a specific Chromium build.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const origin = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const config = JSON.parse(readFileSync("boneyard.config.json", "utf-8"));
const { breakpoints, out, wait = 1500 } = config;

// Pages that together render every <BoneRegion>, with typical content.
const pages = [
  "/explore/cmpt-225",
  "/instructors/Brian%20Fraser",
  "/explore",
  "/explore?mode=instructors",
];

const round = (n, digits) => +n.toFixed(digits);

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage();
await page.addInitScript(() => {
  window.__BONEYARD_BUILD = true;
});

/** name → { breakpoints: { [width]: { width, height, bones } } } */
const collected = {};

for (const path of pages) {
  console.log(path);
  for (const width of breakpoints) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + path, { waitUntil: "load" });
    // Like boneyard: wait for data, but capture anyway on a busy page.
    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await page.waitForFunction(() => window.__BONEYARD_SNAPSHOT, null, {
      timeout: 15_000,
    });
    await page.waitForTimeout(wait);

    const results = await page.evaluate(() => {
      const found = {};
      for (const el of document.querySelectorAll("[data-boneyard]")) {
        const name = el.getAttribute("data-boneyard");
        const target = el.firstElementChild;
        if (!name || !target || found[name]) continue;
        found[name] = window.__BONEYARD_SNAPSHOT(target, name);
      }
      return found;
    });

    for (const [name, result] of Object.entries(results)) {
      if (result.height < 1) continue;
      // The first page that renders a region is its template.
      if (collected[name]?.from && collected[name].from !== path) continue;
      collected[name] ??= { from: path, breakpoints: {} };
      collected[name].breakpoints[width] = {
        width: result.width,
        height: result.height,
        bones: result.bones.map((b) => {
          const bone = [round(b.x, 2), b.y, round(b.w, 2), b.h, b.r];
          if (b.c) bone.push(true);
          return bone;
        }),
      };
    }
    console.log(`  ${width}px  ${Object.keys(results).join(", ")}`);
  }
}

await browser.close();

for (const [name, { breakpoints: captured }] of Object.entries(collected)) {
  const file = join(out, `${name}.bones.json`);
  writeFileSync(file, JSON.stringify({ breakpoints: captured }) + "\n");
  const counts = Object.values(captured).map((c) => c.bones.length);
  console.log(`${name.padEnd(26)} ${counts.join("/")} bones → ${file}`);
}
