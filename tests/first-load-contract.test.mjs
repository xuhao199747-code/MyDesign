import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("hero critical resources stay lightweight", () => {
  const config = read("js/site-config.js");
  const criticalBlock = config.match(/const heroCriticalResources = \[(.*?)\];/s)?.[1] || "";
  assert.doesNotMatch(criticalBlock, /sprite(?:_[234])?\.webp/);
  assert.match(criticalBlock, /frame_front\.webp/);
  assert.doesNotMatch(criticalBlock, /Frame 2085668692/);
});

test("preloader waits for the complete configured asset set", () => {
  const config = read("js/site-config.js");
  assert.match(config, /waitForAllResources:\s*true/);
  assert.doesNotMatch(config, /maxDisplayMs:\s*5000/);
});

test("preloader exposes staged status for diagnostics", () => {
  const preloader = read("js/modules/preloader.js");
  assert.match(preloader, /__sitePreloadStatus/);
  assert.match(preloader, /static-ready/);
  assert.match(preloader, /hero-ready/);
  assert.match(preloader, /loadBlockingResources/);
});

test("hero keeps PC poster feedback while mobile stays static", () => {
  const tracker = read("js/modules/head-tracker.js");
  const styles = read("styles.css");
  assert.match(tracker, /hero:poster-interaction/);
  assert.match(tracker, /--hero-poster-x/);
  assert.match(tracker, /--hero-poster-y/);
  assert.match(tracker, /updatePosterInteraction/);
  assert.doesNotMatch(tracker, /updateMobilePoster/);
  assert.doesNotMatch(tracker, /addEventListener\("pointermove", updateMobilePoster/);
  assert.match(styles, /\.head-tracker__poster[\s\S]*left: 0[\s\S]*width: 100%[\s\S]*object-fit: cover/);
});

test("near-viewport media loader is wired before the main runtime", () => {
  const html = read("index.html");
  const mediaLoader = read("js/modules/media-loader.js");
  assert.match(mediaLoader, /IntersectionObserver/);
  assert.match(mediaLoader, /180%/);
  assert.ok(html.indexOf("media-loader.js") < html.indexOf("./script.js"));
});
