# First Load Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户第一次打开作品集时先看到完整、可用的静态界面，再渐进启用首屏转头和后续图片，避免长时间黑屏、首屏不动或滚动后出现空白。

**Architecture:** 将加载拆成“首屏静态可见 → 首屏 sprite 可交互 → 临近视口内容资源”三阶段。预加载器只负责首屏 poster、基础脚本和状态展示；`head-tracker` 独立负责 sprite 的解码与交互 ready；新增的页面图片调度只在区块接近视口时加载，不让 React、聊天或后台模块阻塞静态页面。

**Tech Stack:** 原生 HTML/CSS/JavaScript、Vite、GSAP、Canvas sprite、IntersectionObserver、现有 React bootstrap。

## Global Constraints

- 不修改 `src/chat/`、`src/admin/`、`src/bootstrap.jsx`、`script.js` 和 `src/components/Lanyard/`，除非测试证明它们直接阻塞首页。
- 保留现有首屏 poster、sprite 交互、页面模块、素材和导航行为，不通过删除模块解决加载问题。
- 首屏静态画面必须在资源异常时仍可见；sprite 失败不能阻塞后续页面。
- 首屏加载目标：正常网络下预加载层不超过 1.5 秒；慢网络下先展示 poster，不永久等待大文件。
- 每个任务都先写失败测试或可重复的浏览器验收检查，再改实现。
- 每次代码改动后运行 `npm run build`。

---

### Task 1: 建立首次加载诊断和验收基线

**Files:**
- Create: `/Users/mac/Documents/vibcoding/个人网站/tests/first-load-contract.test.mjs`
- Modify: `/Users/mac/Documents/vibcoding/个人网站/package.json`
- Inspect only: `/Users/mac/Documents/vibcoding/个人网站/index.html`
- Inspect only: `/Users/mac/Documents/vibcoding/个人网站/js/modules/preloader.js`
- Inspect only: `/Users/mac/Documents/vibcoding/个人网站/js/modules/head-tracker.js`

**Interfaces:**
- Produces a Node test command: `npm run test:first-load`.
- Produces browser acceptance fields: `preloaderVisible`, `posterLoaded`, `heroReady`, `heroFrame`, `nearViewportImagesLoaded`, `bootErrors`.

- [ ] **Step 1: 写失败测试，锁定当前加载契约**

  在 `tests/first-load-contract.test.mjs` 中读取 `js/site-config.js`、`js/modules/preloader.js` 和 `js/modules/head-tracker.js`，断言：

  ```js
  import assert from "node:assert/strict";
  import fs from "node:fs";
  import test from "node:test";

  const config = fs.readFileSync("js/site-config.js", "utf8");
  const preloader = fs.readFileSync("js/modules/preloader.js", "utf8");
  const tracker = fs.readFileSync("js/modules/head-tracker.js", "utf8");

  test("desktop critical resources do not include the full sprite sheet", () => {
    assert.doesNotMatch(
      config,
      /const heroCriticalResources = \[[\s\S]*?sprite\.webp[\s\S]*?\]/,
      "5MB sprite must not block first paint"
    );
  });

  test("hero exposes a first-frame ready signal", () => {
    assert.match(tracker, /hero:first-frame-ready/);
  });

  test("background loading does not depend only on idle callback", () => {
    assert.match(preloader, /setTimeout\(loadBackgroundResources, 240\)/);
  });

  test("preloader exposes an observable status object", () => {
    assert.match(preloader, /window\.__sitePreloadStatus/);
  });
  ```

- [ ] **Step 2: 运行失败测试确认基线**

  Run: `node --test tests/first-load-contract.test.mjs`

  Expected before implementation: the status-object assertion fails against the current implementation; this confirms the test detects the missing observability contract instead of only testing an already-passing path.

- [ ] **Step 3: 添加测试脚本**

  在 `package.json` 的 `scripts` 中加入：

  ```json
  "test:first-load": "node --test tests/first-load-contract.test.mjs"
  ```

- [ ] **Step 4: 运行基线构建**

  Run: `npm run build`

  Expected: build exits with code 0；允许现有 Vite classic-script 和大 chunk warning。

### Task 2: 重做预加载器的三阶段状态机

**Files:**
- Modify: `/Users/mac/Documents/vibcoding/个人网站/js/modules/preloader.js`
- Modify: `/Users/mac/Documents/vibcoding/个人网站/js/site-config.js`
- Test: `/Users/mac/Documents/vibcoding/个人网站/tests/first-load-contract.test.mjs`

**Interfaces:**
- `window.__sitePreloadStatus` returns `{ phase, percent, failedResources, startedAt, completedAt }`.
- Events remain compatible: `site:boot-complete` and `hero:first-frame-ready`.
- New events: `site:preload-phase` with `detail.phase` equal to `static-ready`, `hero-ready`, or `complete`.

- [ ] **Step 1: 扩展失败测试，验证状态机接口**

  增加：

  ```js
  test("preloader exposes three explicit loading phases", () => {
    assert.match(preloader, /window\.__sitePreloadStatus/);
    assert.match(preloader, /static-ready/);
    assert.match(preloader, /hero-ready/);
    assert.match(preloader, /site:preload-phase/);
  });
  ```

- [ ] **Step 2: 将配置拆为首屏阻塞和后台资源**

  `js/site-config.js` 保留 `frame_front.webp` 和首屏必要小图作为 `criticalResources`；不把 `sprite.webp`、`sprite_2.webp`、`sprite_3.webp`、`sprite_4.webp`、20 个 logo 或字体文件放进桌面首屏阻塞列表。将页面真实使用的项目图放进 `nonCriticalResources`，并保留现有移动端较小清单。

- [ ] **Step 3: 实现状态转换**

  `js/modules/preloader.js` 使用以下规则：

  ```js
  static-ready = poster 已完成加载 && boot 已完成或 bootGrace 已结束
  hero-ready = static-ready && hero:first-frame-ready
  complete = hero-ready && 后台调度已启动
  ```

  `static-ready` 时隐藏遮罩并允许页面滚动；`hero-ready` 只更新状态，不重新阻塞页面；任何单个后台资源失败只进入 `failedResources`，不能让 Promise 永久 pending。把状态暴露到 `window.__sitePreloadStatus`，方便浏览器验收。

- [ ] **Step 4: 用显式短延时启动后台资源**

  首屏遮罩隐藏后用 `setTimeout(loadBackgroundResources, 240)` 启动后台图片，不再只依赖 `requestIdleCallback`。保留去重集合，确保 HTML 原生图片和预加载器不会重复创建无限请求。

- [ ] **Step 5: 运行测试和构建**

  Run: `npm run test:first-load && npm run build`

  Expected: tests PASS，build exits 0。

### Task 3: 修复首屏 sprite 的加载、解码和交互启动

**Files:**
- Modify: `/Users/mac/Documents/vibcoding/个人网站/js/modules/head-tracker.js`
- Modify: `/Users/mac/Documents/vibcoding/个人网站/index.html`
- Modify: `/Users/mac/Documents/vibcoding/个人网站/styles.css`
- Test: `/Users/mac/Documents/vibcoding/个人网站/tests/first-load-contract.test.mjs`

**Interfaces:**
- `data-section-node="head-tracker-poster"` remains the static fallback.
- `data-section-node="head-tracker-canvas"` remains the interactive surface.
- `hero:first-frame-ready` fires exactly once after the first sprite frame is decoded and painted.
- `window.HEAD_TRACKER_TEST.getState().frame` changes after a pointer move when sprite sheet 0 is ready.

- [ ] **Step 1: 写失败测试，锁定首屏 fallback 和事件**

  增加：

  ```js
  test("hero keeps a static poster before canvas is ready", () => {
    const html = fs.readFileSync("index.html", "utf8");
    assert.match(html, /data-section-node="head-tracker-poster"[\s\S]*?frame_front\.webp/);
    assert.match(html, /data-section-node="head-tracker-canvas"/);
  });

  test("tracker does not activate motion before the first painted frame", () => {
    assert.match(tracker, /hasPaintedFrame/);
    assert.match(tracker, /hero:first-frame-ready/);
  });
  ```

- [ ] **Step 2: 把 sprite 加载拆成 sheet 0 和剩余 sheet**

  `head-tracker.js` 首先只请求 `sprite.webp`，完成 `decode()`、`createImageBitmap()` 并绘制 `frontFrame` 后再添加 `.is-ready` 和派发 `hero:first-frame-ready`。剩余三个 sheet 只在 sheet 0 ready 后通过受控队列加载，不能参与首屏 ready 判断。

- [ ] **Step 3: 修复缓存图片和动态图片两条路径**

  对 `window.__preloadedImages` 中已经 complete 的图片直接执行同一份 `markReady`；对新建的 `Image` 统一绑定 `load` 和 `error`，避免 cached path 与 fresh path 行为不同。`error` 时保留 poster，并在 `window.__siteBootStatus` 或 `console.warn` 中报告具体 URL。

- [ ] **Step 4: 验证交互启动**

  启动 Vite：`npm run dev -- --host 127.0.0.1`。浏览器打开 `http://127.0.0.1:5173/`，记录：

  ```js
  {
    poster: document.querySelector('[data-section-node="head-tracker-poster"]')?.complete,
    ready: document.querySelector('[data-head-tracker]')?.classList.contains('is-ready'),
    frameBefore: window.HEAD_TRACKER_TEST?.getState()?.frame,
    frameAfter: window.HEAD_TRACKER_TEST?.getState()?.frame,
  }
  ```

  将鼠标从首屏中心移到右侧，Expected: `ready === true` 且 `frameAfter !== frameBefore`；在 sprite 未完成前 Expected: poster 仍可见且页面不被黑色遮罩永久挡住。

- [ ] **Step 5: 运行测试和构建**

  Run: `npm run test:first-load && npm run build`

  Expected: tests PASS，build exits 0。

### Task 4: 建立后续图片的“临近视口加载”机制

**Files:**
- Create: `/Users/mac/Documents/vibcoding/个人网站/js/modules/media-loader.js`
- Modify: `/Users/mac/Documents/vibcoding/个人网站/index.html`
- Modify: `/Users/mac/Documents/vibcoding/个人网站/js/site-config.js`
- Test: `/Users/mac/Documents/vibcoding/个人网站/tests/first-load-contract.test.mjs`

**Interfaces:**
- `window.__siteMediaLoader.getState()` returns `{ observed, loaded, failed }`.
- Elements use `data-media-src` only when the image should be scheduled by the module; existing visible `src` values are preserved until the feature is verified.
- `media-loader.js` emits `site:media-loaded` and `site:media-error` with the source URL.

- [ ] **Step 1: 写失败测试，锁定媒体调度契约**

  增加：

  ```js
  test("media loader has a near-viewport observer and error path", () => {
    const mediaLoader = fs.readFileSync("js/modules/media-loader.js", "utf8");
    assert.match(mediaLoader, /IntersectionObserver/);
    assert.match(mediaLoader, /site:media-loaded/);
    assert.match(mediaLoader, /site:media-error/);
    assert.match(mediaLoader, /rootMargin/);
  });
  ```

- [ ] **Step 2: 实现只加载临近区块的媒体调度器**

  使用 `IntersectionObserver`，配置 `rootMargin: "120% 0px"`。进入观察范围时：如果元素是图片且存在 `data-media-src`，先设置 `fetchPriority = "low"`，再设置 `src`；设置 `decoding = "async"`，在 `load` 后记录状态；在 `error` 后记录 URL 但不隐藏卡片。

- [ ] **Step 3: 在内容模块边界接入**

  只给作品卡片、照片区、联系区等下方媒体加 `data-media-src`，不要改 React 聊天、后台或吊牌模块。首屏 poster 和首屏 canvas 不交给这个调度器，避免两个加载系统互相竞争。

- [ ] **Step 4: 验证滚动加载**

  浏览器打开首页后先检查首屏下方图片没有请求阻塞首屏；再分段滚动到 `#photo`、`#portfolio`、`#contact`，Expected: 对应区块进入视口前后图片从未加载变为已加载，且没有 `site:media-error`。

- [ ] **Step 5: 运行测试和构建**

  Run: `npm run test:first-load && npm run build`

  Expected: tests PASS，build exits 0。

### Task 5: 做首次访问、缓存访问和异常网络三轮验收

**Files:**
- Test: `/Users/mac/Documents/vibcoding/个人网站/tests/first-load-contract.test.mjs`

  本任务只做验收，不预先修改生产代码；若发现回归，回到对应的 Task 2、Task 3 或 Task 4 修复。

- [ ] **Step 1: 冷缓存验收**

  使用浏览器开发者工具清空站点缓存后打开首页，记录 poster、preloader、首帧、后续图片时间。Expected：poster 先出现，首屏不永久黑屏；首屏 sprite ready 后鼠标可改变 frame；下方图片在滚动到附近时出现。

- [ ] **Step 2: 热缓存验收**

  刷新两次，Expected：预加载层明显缩短或跳过；首屏交互仍正常；不重复创建大量 `Image` 请求。

- [ ] **Step 3: 弱网和失败资源验收**

  将 sprite 或下方一张图片模拟为失败，Expected：poster、导航、文字和其他内容仍可用；`failedResources` 或 `site:media-error` 指向失败 URL；页面不永久停在 98%。

- [ ] **Step 4: 检查 React 不阻塞静态层**

  确认聊天、菜单图标、吊牌初始化失败时，`#home`、导航和下方静态内容仍能显示。只记录错误，不修改 `src/chat/`、`src/admin/` 或 `src/bootstrap.jsx`，除非错误明确来自它们且用户另行授权。

- [ ] **Step 5: 最终验证**

  Run: `npm run test:first-load && npm run build`

  Expected: tests PASS，build exits 0；最后检查 `git diff` 只包含首次加载相关文件。
