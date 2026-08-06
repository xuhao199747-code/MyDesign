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

test("home page no longer links to the removed secondary project page", () => {
  const html = read("index.html");
  const siteContent = read("js/modules/site-content.js");
  const bounceCards = read("src/BounceCards.jsx");

  assert.doesNotMatch(html, /project\.html/);
  assert.doesNotMatch(siteContent, /project\.html/);
  assert.doesNotMatch(bounceCards, /project\.html/);
  assert.equal(fs.existsSync(path.join(root, "project.html")), false);
  assert.equal(fs.existsSync(path.join(root, "vite.project.config.mjs")), false);
});

test("featured carousel keeps adjacent cards visually close", () => {
  const html = read("index.html");
  const styles = read("styles.css");

  assert.match(html, /--featured-gap:clamp\(24px,4vw,72px\)/);
  assert.match(styles, /--featured-gap: clamp\(24px, 4vw, 72px\)/);
});

test("lets work section stays hidden until it is ready to be shown", () => {
  const html = read("index.html");
  const portfolioSection = html.match(/<section\s+id="portfolio"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(portfolioSection, /class="[^"]*\bhidden\b[^"]*"/);
});

test("vibe coding section stays hidden until it is ready to be shown", () => {
  const html = read("index.html");
  const portfolioCopySection =
    html.match(/<section\s+id="portfolio-copy"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(portfolioCopySection, /class="[^"]*\bhidden\b[^"]*"/);
});

test("works navigation targets the visible featured portfolio section", () => {
  const html = read("index.html");

  assert.match(html, /<li><a href="#portfolio-featured">作品<\/a><\/li>/);
});

test("portfolio title images keep the requested swapped order", () => {
  const html = read("index.html");
  const config = read("js/site-config.js");
  const portfolioCopySection =
    html.match(/<section\s+id="portfolio-copy"[\s\S]*?<\/section>/)?.[0] || "";
  const featuredSection =
    html.match(/<section\s+id="portfolio-featured"[\s\S]*?<\/section>/)?.[0] || "";

  assert.match(portfolioCopySection, />MY DESIGN<\/h2>/);
  assert.match(config, /featured:\s*\{[\s\S]*?title:\s*"VIBE CODING"/);
  assert.match(featuredSection, />VIBE CODING<\/h2>/);
});

test("featured carousel uses the VIBE CODING project cards and labels", () => {
  const html = read("index.html");
  const config = read("js/site-config.js");
  const featuredSection =
    html.match(/<section\s+id="portfolio-featured"[\s\S]*?<\/section>/)?.[0] || "";

  [
    ["组件库", "loding-app-card.webp"],
    ["猪猪黄昏", "pigpig-card.webp"],
    ["LODING", "loding-five-card.webp"],
    ["PORTRAIT", "photo2.webp"],
    ["BRAIN UI", "frame_front.webp"],
    ["SNEAKERS", "design top.webp"],
    ["Agent执行流程", "agent-flow-card.png"],
  ].forEach(([title, image]) => {
    assert.match(featuredSection, new RegExp(`data-title="${title}"`));
    assert.match(featuredSection, new RegExp(`src="\\./imag/${image.replace(" ", "\\s")}"`));
  });
  assert.doesNotMatch(featuredSection, /data-title="Profile"/);
  assert.doesNotMatch(featuredSection, /data-title="About"/);
  assert.match(config, /featured:\s*\{[\s\S]*?cards:\s*\[[\s\S]*?loding-app-card\.webp/);
  assert.match(config, /cards:\s*\[[\s\S]*?title:\s*"组件库"[\s\S]*?title:\s*"猪猪黄昏"[\s\S]*?title:\s*"LODING"/);
  assert.match(config, /title:\s*"Agent执行流程"[\s\S]*?logic-flow-diagram\.vercel\.app/);
  assert.match(config, /title:\s*"组件库"[\s\S]*?shadcn-docs-six\.vercel\.app/);
  assert.match(config, /title:\s*"猪猪黄昏"[\s\S]*?pigpig\.vercel\.app/);
  assert.match(config, /title:\s*"LODING"[\s\S]*?loding-five\.vercel\.app/);
});

test("featured cards expose hover descriptions", () => {
  const module = read("js/modules/portfolio-featured.js");
  const styles = read("styles.css");

  assert.match(module, /description:\s*card\.dataset\.description/);
  assert.match(module, /portfolio-featured__description/);
  assert.match(styles, /\.portfolio-featured__description[\s\S]*?opacity: 0/);
  assert.match(styles, /\.portfolio-featured__cell:hover \.portfolio-featured__description/);
});

test("featured card taps open project links in a new tab", () => {
  const module = read("js/modules/portfolio-featured.js");

  assert.match(module, /cell\.dataset\.href = item\.href/);
  assert.match(module, /window\.open\(pressedCellHref, "_blank", "noopener,noreferrer"\)/);
  assert.doesNotMatch(module, /window\.location\.assign\(pressedCellHref\)/);
});

test("featured carousel keeps card spacing uniform during motion", () => {
  const module = read("js/modules/portfolio-featured.js");
  const styles = read("styles.css");

  assert.match(module, /const gearAngleStep =/);
  assert.match(module, /Math\.sin\(gearAngleStep/);
  assert.match(module, /Math\.cos\(gearAngle\)/);
  assert.match(module, /const arcRadius =/);
  assert.doesNotMatch(module, /distance \* rotationStrength/);
  assert.doesNotMatch(module, /normalizedDistance/);
  assert.match(styles, /transform-origin: center;/);
});

test("featured gear layout preserves each card's track position", () => {
  const module = read("js/modules/portfolio-featured.js");
  const html = read("index.html");

  assert.match(module, /const gearAngleStep = isMobileViewport \? Math\.PI \/ 5 : Math\.PI \/ 6;/);
  assert.match(module, /const cellX = arcX;/);
  assert.doesNotMatch(module, /const cellX = arcX - offset \* slotPitch;/);
  assert.match(html, /--featured-card-w:min\(350px,23vw\)/);
  assert.match(html, /max-md:\[--featured-card-w:min\(240px,62vw\)\]/);
});

test("vibe coding title uses the bulb decoration while my design uses fire", () => {
  const playfulTitle = read("js/modules/playful-title-hover.js");

  assert.match(playfulTitle, /const isVibeCodingTitle = accessibleText === "VIBE CODING"/);
  assert.match(playfulTitle, /const isMyDesignTitle = accessibleText === "MY DESIGN"/);
  assert.match(playfulTitle, /isVibeCodingTitle[\s\S]*?play-title__sticker--light-bulb/);
  assert.match(playfulTitle, /isMyDesignTitle[\s\S]*?play-title__sticker--design-fire/);
});
