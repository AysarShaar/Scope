#!/usr/bin/env node
// Screenshots of /admin/dashboard: mobile + desktop, light + dark.
//
//   node scripts/analytics-screenshots.mjs [--base=http://localhost:3000] [--state=admin-state.json]
//
// Needs Playwright installed on YOUR machine (not added to package.json):
//   npx playwright install chromium   # and `npm i -D playwright` or use a global install
// --state is a Playwright storage-state file from a logged-in ADMIN session
//   (e.g. `npx playwright codegen --save-storage=admin-state.json http://localhost:3000/admin`).
// It shows the REAL API response, so connect Cloudflare first to see real data.
//
// The site's ThemeContext forces light mode and strips the `dark` class on mount,
// so dark is checked by re-adding the class after load (the dashboard's dark:
// styles are otherwise unreachable in the running app).
import fs from "node:fs";
import { chromium } from "playwright";

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split("=").slice(1).join("=");
const base = arg("base", "http://localhost:3000");
const state = arg("state", "");
const outDir = "scripts/analytics-screenshots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const [label, viewport] of [["mobile", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 900 }]]) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport, ...(state ? { storageState: state } : {}) });
    const page = await ctx.newPage();
    await page.goto(`${base}/admin/dashboard?range=7d`, { waitUntil: "networkidle" });
    await page.waitForSelector("h1");
    await page.evaluate((t) => document.documentElement.classList.toggle("dark", t === "dark"), theme);
    await page.waitForTimeout(400);
    // horizontal overflow is the classic mobile/RTL failure: report it with the screenshot
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `${outDir}/${label}-${theme}.png`, fullPage: true });
    console.log(`${label}-${theme}: horizontal overflow ${overflow}px`);
    await ctx.close();
  }
}
await browser.close();
