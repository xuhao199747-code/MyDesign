(function registerHeadTrackerModule() {
  const siteRuntime = window.__siteRuntime || {};
  const siteSections = window.__siteSections || {};
  const queryElement =
    siteRuntime.queryElement || ((selector, root = document) => root.querySelector(selector));
  const registerSiteModule =
    siteRuntime.registerSiteModule ||
    ((moduleName, initModule) => {
      if (!window.__siteModules) window.__siteModules = {};
      window.__siteModules[moduleName] = initModule;
    });

  function initHeadTrackerModule(options = {}) {
    const {
      headTrackerConfig = {},
      siteUtils = {
        getArrayOption(_object, _key, fallback) {
          return fallback;
        },
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
      },
      siteHelpers = {
        createHeadTrackerMath() {
          return {
            normalizeFrame(frame) {
              return frame;
            },
            signedFrameDelta(fromFrame, toFrame) {
              return toFrame - fromFrame;
            },
            pickCalibratedFrame() {
              return { frame: 0, direction: "center" };
            },
          };
        },
      },
    } = options;

    const homeElements = siteSections.getHomeSectionElements?.().home || {};
    const tracker = homeElements.tracker || queryElement("[data-head-tracker]");
    if (!tracker) return;
    const homeSection =
      homeElements.section ||
      tracker.closest?.('[data-site-section="home"]') ||
      document.getElementById("home");
    if (!homeSection) return;
    if (tracker.dataset.headTrackerReady === "true") return;
    tracker.dataset.headTrackerReady = "true";

    const canvas =
      homeElements.trackerCanvas || tracker.querySelector(".head-tracker__sprite");
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const frameCount = siteUtils.getNumberOption(headTrackerConfig, "frameCount", 240);
    const frameCols = siteUtils.getNumberOption(headTrackerConfig, "frameCols", 12);
    const framesPerSheet = siteUtils.getNumberOption(headTrackerConfig, "framesPerSheet", 60);
    const frameWidth = siteUtils.getNumberOption(headTrackerConfig, "frameWidth", 1280);
    const frameHeight = siteUtils.getNumberOption(headTrackerConfig, "frameHeight", 720);
    const frontFrame = siteUtils.getNumberOption(headTrackerConfig, "frontFrame", 0);
    const centerDeadZone = siteUtils.getNumberOption(headTrackerConfig, "centerDeadZone", 54);
    const lookCenterX = siteUtils.getNumberOption(headTrackerConfig, "lookCenterX", 0.5);
    const lookCenterY = siteUtils.getNumberOption(headTrackerConfig, "lookCenterY", 0.56);
    const angleKeys = siteUtils.getArrayOption(headTrackerConfig, "angleKeys", [
      { angle: 0, frame: 60, direction: "right", videoFrame: 150 },
      { angle: 45, frame: 75, direction: "right-down", videoFrame: 187 },
      { angle: 90, frame: 94, direction: "down", videoFrame: 237 },
      { angle: 135, frame: 114, direction: "left-down", videoFrame: 287 },
      { angle: 180, frame: 135, direction: "left", videoFrame: 338 },
      { angle: 225, frame: 156, direction: "left-up", videoFrame: 391 },
      { angle: 270, frame: 166, direction: "up", videoFrame: 416 },
      { angle: 315, frame: 45, direction: "right-up", videoFrame: 112 },
      { angle: 360, frame: 60, direction: "right", videoFrame: 150 },
    ]);
    const spriteSrcs = siteUtils.getArrayOption(headTrackerConfig, "spriteSrcs", [
      "./imag/sprite.webp",
      "./imag/sprite_2.webp",
      "./imag/sprite_3.webp",
      "./imag/sprite_4.webp",
    ]);

    let displayedFrame = frontFrame;
    let targetFrame = frontFrame;
    let targetDirection = "center";
    let pointerRafId = 0;
    let motionRafId = 0;
    let queuedPoint = null;
    let hasPaintedFrame = false;
    let isTrackerActive = true;

    const preloadedCache = window.__preloadedImages || new Map();
    const spriteImages = spriteSrcs.map((src) => {
      const cached = preloadedCache.get(src);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        return cached;
      }
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      return image;
    });

    const spriteReady = new Set();
    const spriteBitmaps = new Map();
    const headTrackerMath = siteHelpers.createHeadTrackerMath({
      frameCount,
      angleKeys,
      frontFrame,
    });
    const prewarmCanvas = document.createElement("canvas");
    prewarmCanvas.width = frameWidth;
    prewarmCanvas.height = frameHeight;
    const prewarmContext = prewarmCanvas.getContext("2d", { alpha: false });

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const runWhenIdle = (callback) => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(callback, { timeout: 1200 });
        return;
      }
      window.setTimeout(callback, 120);
    };

    const prewarmFrame = (frame) => {
      if (!prewarmContext) return;
      const sheetIndex = Math.floor(frame / framesPerSheet);
      const sheetFrame = frame % framesPerSheet;
      const spriteSource = spriteBitmaps.get(sheetIndex) || spriteImages[sheetIndex];
      if (!spriteSource || !spriteReady.has(sheetIndex)) return;

      prewarmContext.drawImage(
        spriteSource,
        (sheetFrame % frameCols) * frameWidth,
        Math.floor(sheetFrame / frameCols) * frameHeight,
        frameWidth,
        frameHeight,
        0,
        0,
        frameWidth,
        frameHeight
      );
    };

    const { normalizeFrame, signedFrameDelta, pickCalibratedFrame } = headTrackerMath;

    const drawFrame = (frame) => {
      const sheetIndex = Math.floor(frame / framesPerSheet);
      const sheetFrame = frame % framesPerSheet;
      const spriteSource = spriteBitmaps.get(sheetIndex) || spriteImages[sheetIndex];
      if (!spriteSource || !spriteReady.has(sheetIndex)) return false;

      const col = sheetFrame % frameCols;
      const row = Math.floor(sheetFrame / frameCols);
      context.drawImage(
        spriteSource,
        col * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      if (!hasPaintedFrame) {
        hasPaintedFrame = true;
        tracker.classList.add("is-ready");
        window.dispatchEvent(new CustomEvent("hero:first-frame-ready"));
      }

      return true;
    };

    const renderFrame = (frame, direction) => {
      tracker.style.setProperty("--head-frame", String(frame));
      tracker.style.setProperty("--head-col", String(frame % frameCols));
      tracker.style.setProperty("--head-row", String(Math.floor(frame / frameCols)));
      tracker.dataset.frame = String(frame);
      tracker.dataset.direction = direction;
      drawFrame(frame);
    };

    const setFrame = (frame, direction) => {
      displayedFrame = normalizeFrame(frame);
      targetFrame = displayedFrame;
      targetDirection = direction;
      renderFrame(displayedFrame, direction);
    };

    const startMotionLoop = () => {
      if (motionRafId) return;

      motionRafId = window.requestAnimationFrame(function tick() {
        const delta = signedFrameDelta(displayedFrame, targetFrame);
        if (delta === 0) {
          motionRafId = 0;
          renderFrame(targetFrame, targetDirection);
          return;
        }

        const stepSize = Math.min(2, Math.max(1, Math.ceil(Math.abs(delta) / 42)));
        const step = Math.sign(delta) * stepSize;
        displayedFrame = normalizeFrame(displayedFrame + step);
        if (Math.abs(delta) <= stepSize) displayedFrame = targetFrame;
        renderFrame(displayedFrame, targetDirection);
        motionRafId = window.requestAnimationFrame(tick);
      });
    };

    const setTargetFrame = (frame, direction) => {
      const nextTarget = normalizeFrame(frame);
      if (nextTarget === targetFrame && targetDirection === direction) return;
      targetFrame = nextTarget;
      targetDirection = direction;
      startMotionLoop();
    };

    const updateFromPoint = (clientX, clientY) => {
      const rect = tracker.getBoundingClientRect();
      const centerX = rect.left + rect.width * lookCenterX;
      const centerY = rect.top + rect.height * lookCenterY;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);

      if (distance < centerDeadZone) {
        setTargetFrame(frontFrame, "center");
        return;
      }

      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const normalizedAngle = (angle + 360) % 360;
      const key = pickCalibratedFrame(normalizedAngle);
      setTargetFrame(key.frame, key.direction);
    };

    const queueUpdateFromPoint = (clientX, clientY) => {
      if (!isTrackerActive) return;
      queuedPoint = { clientX, clientY };
      if (pointerRafId) return;
      pointerRafId = window.requestAnimationFrame(() => {
        pointerRafId = 0;
        if (!queuedPoint) return;
        updateFromPoint(queuedPoint.clientX, queuedPoint.clientY);
        queuedPoint = null;
      });
    };

    window.HEAD_TRACKER_ANGLE_KEYS = angleKeys;
    window.HEAD_TRACKER_TEST = {
      setFrame,
      updateFromPoint,
      setTargetFrame,
      getState: () => ({
        frame: Number(tracker.dataset.frame),
        direction: tracker.dataset.direction,
        targetFrame,
        targetDirection,
      }),
    };

    spriteImages.forEach((image, index) => {
      const isFromCache = preloadedCache.has(spriteSrcs[index]);
      const markReady = async () => {
        if (!isFromCache) {
          try {
            if (typeof image.decode === "function") await image.decode();
          } catch {}
        }

        if ("createImageBitmap" in window) {
          try {
            spriteBitmaps.set(index, await createImageBitmap(image));
          } catch {
            spriteBitmaps.delete(index);
          }
        }

        if (prewarmContext) {
          const spriteSource = spriteBitmaps.get(index) || image;
          prewarmContext.drawImage(
            spriteSource,
            0,
            0,
            frameWidth,
            frameHeight,
            0,
            0,
            frameWidth,
            frameHeight
          );
        }

        spriteReady.add(index);
        runWhenIdle(() => {
          const start = index * framesPerSheet;
          [0, 15, 30, 45, 59].forEach((offset) => {
            const frame = start + offset;
            if (frame < frameCount) prewarmFrame(frame);
          });
        });
        drawFrame(displayedFrame);
      };

      image.addEventListener("load", markReady, { once: true });
      if (image.complete) markReady();
    });

    setFrame(frontFrame, "center");

    if ("IntersectionObserver" in window) {
      const trackerObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          isTrackerActive = Boolean(entry?.isIntersecting);
          if (!isTrackerActive) {
            queuedPoint = null;
            setTargetFrame(frontFrame, "center");
          }
        },
        {
          root: null,
          rootMargin: "20% 0px 20% 0px",
          threshold: 0,
        }
      );
      trackerObserver.observe(tracker);
    }

    homeSection.addEventListener(
      "pointermove",
      (event) => queueUpdateFromPoint(event.clientX, event.clientY),
      { passive: true }
    );
    homeSection.addEventListener(
      "pointerleave",
      () => {
        queuedPoint = null;
        setTargetFrame(frontFrame, "center");
      },
      { passive: true }
    );
  }

  registerSiteModule("initHeadTrackerModule", initHeadTrackerModule);
})();
