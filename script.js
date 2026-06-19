/**
 * 作品集页面交互脚本
 *
 * 模块概览：
 * 0. 页面预加载 — 加载图片、字体等资源，显示加载进度
 * 1. 导航菜单 — 移动端抽屉开关、点击链接关闭、大屏重置
 * 2. 锚点滚动 — 平滑滚动到 # 区块，并扣除固定导航占位
 * 3. Logo 墙物理 — 技能图标下落、碰撞、落地静止；进入视口后启动
 * 4. 照片区揭幕 — 双图叠放，上层不位移，随滚动用裁剪减小上层可见区域以露出下层（非透明度）
 * 5. GSAP Flair — 鼠标移动拖尾小图动画（需先加载 gsap.min.js）
 * 6. 工作经历区悬停预览 — GreenSock quickTo + autoAlpha（.works-swipe-section，CodePen PwqrzeG）
 * 7. 作品区无限卡片 — Draggable + 横向滚轮（无 pin，CodePen RwKwLWK 变体）
 * 8. 首屏装饰文字鼠标跟随效果
 */

// =============================================================================
// 模块 0：页面预加载
// =============================================================================
(function initPreloader() {
  const preloader = document.getElementById("preloader");
  const progressBar = document.querySelector(".preloader__bar");
  const progressText = document.querySelector(".preloader__text");
  const typeText = document.querySelector(".preloader__type-text");

  if (!preloader) return;

  // 关键资源：首屏必须加载完才显示（sprite 精灵图 + 正面帧）
  const criticalResources = [
    "./imag/frame_front.webp",
    "./imag/sprite.webp",
    "./imag/sprite_2.webp",
    "./imag/sprite_3.webp",
    "./imag/sprite_4.webp",
  ];

  // 非关键资源：后台并行加载，不阻塞首屏显示
  const nonCriticalResources = [
    "./imag/photo1.png",
    "./imag/photo2.png",
    "./imag/portfolio-cards1.webp",
    "./imag/Frame 2085668692.png",
    "./imag/Group 1940698323.png",
    "./imag/Bottom information.png",
    "./imag/Image2.webp",
    "./imag/logo/logo1.webp",
    "./imag/logo/logo2.webp",
    "./imag/logo/logo3.webp",
    "./imag/logo/logo4.webp",
    "./imag/logo/logo5.webp",
    "./imag/logo/logo6.webp",
    "./imag/logo/logo7.webp",
    "./imag/logo/logo8.webp",
    "./imag/logo/logo9.webp",
    "./imag/logo/logo10.webp",
    "./imag/logo/logo11.webp",
    "./imag/logo/logo12.webp",
    "./imag/logo/logo13.webp",
    "./imag/logo/logo14.webp",
    "./imag/logo/logo15.webp",
    "./imag/logo/logo16.webp",
    "./imag/logo/logo17.webp",
    "./imag/logo/logo18.png",
    "./imag/logo/logo19.png",
    "./font/ArchivoBlack-Regular.ttf",
    "./font/LuckiestGuy-Regular.ttf",
  ];

  const allResources = [...criticalResources, ...nonCriticalResources];
  let loadedCount = 0;
  const totalCount = allResources.length;
  let hasHidden = false;
  let criticalReady = false;
  let heroReady = false;
  let minimumDisplayElapsed = false;

  const updateProgress = () => {
    const percentage = Math.round((loadedCount / totalCount) * 100);
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    if (progressText) {
      progressText.textContent = `LOADING ${percentage}%`;
    }
  };

  const hidePreloader = () => {
    if (!preloader || hasHidden) return;
    hasHidden = true;
    preloader.classList.add("preloader--hidden");
    setTimeout(() => {
      preloader.remove();
    }, 600);
  };

  if (typeText) {
    const phrases = [
      "Please wait a moment.",
      "Loading the full experience.",
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tickType = () => {
      if (!document.body.contains(typeText)) return;
      const current = phrases[phraseIndex];
      if (!deleting) {
        charIndex = Math.min(current.length, charIndex + 1);
        typeText.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(tickType, 900);
          return;
        }
        setTimeout(tickType, 42);
        return;
      }

      charIndex = Math.max(0, charIndex - 1);
      typeText.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(tickType, 220);
        return;
      }
      setTimeout(tickType, 24);
    };

    typeText.textContent = "";
    tickType();
  }

  const tryHidePreloader = () => {
    if (!criticalReady || !heroReady || !minimumDisplayElapsed) return;
    criticalReady = true;
    tryHidePreloader();
  };

  // 预加载缓存：将已加载的 Image 对象暴露给其他模块复用
  const preloadedImages = new Map();

  const loadResource = (url) => {
    return new Promise((resolve) => {
      if (preloadedImages.has(url)) {
        resolve();
        return;
      }
      if (url.endsWith(".ttf") || url.endsWith(".otf")) {
        const font = new FontFace("PreloadFont", `url(${url})`);
        font.load().then(resolve).catch(resolve);
      } else {
        const img = new Image();
        img.onload = () => { preloadedImages.set(url, img); resolve(); };
        img.onerror = resolve;
        img.src = url;
      }
    });
  };

  // 暴露预加载缓存，供 head tracker 等模块复用
  window.__preloadedImages = preloadedImages;

  const startLoading = async () => {
    setTimeout(() => {
      minimumDisplayElapsed = true;
      tryHidePreloader();
    }, 900);

    window.addEventListener(
      "hero:first-frame-ready",
      () => {
        heroReady = true;
        tryHidePreloader();
      },
      { once: true }
    );
    // 并行加载所有资源，而非串行等待
    const loadPromises = allResources.map((url) =>
      loadResource(url).then(() => {
        loadedCount++;
        updateProgress();
      })
    );

    // 等待关键资源加载完毕后立即显示首屏
    await Promise.all(
      criticalResources.map((url) => loadResource(url).catch(() => {}))
    );

    // 关键资源就绪，隐藏预加载遮罩
    hidePreloader();

    // 非关键资源继续在后台加载（Promise 已在 loadPromises 中运行）
    await Promise.all(loadPromises);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startLoading, { once: true });
  } else {
    startLoading();
  }

  // 安全兜底：最多 4 秒后强制隐藏
  setTimeout(() => {
    criticalReady = true;
    heroReady = true;
    minimumDisplayElapsed = true;
    hidePreloader();
  }, 7000);
})();

// =============================================================================
// 模块 1：首屏装饰文字鼠标跟随效果
// =============================================================================
(function initHeroTextFloat() {
  const heroTexts = document.querySelectorAll(".hero-nav__text");
  if (!heroTexts.length) return;

  const FUZZ_RANGE = 21;
  const BASE_INTENSITY = 0.12;
  const HOVER_INTENSITY = 0.35;
  const LETTER_SPACING = 2;
  const FPS = 35;
  const GLITCH_MODE = true;
  const CLICK_EFFECT = true;
  const CLICK_BOOST_DURATION = 320;
  const LERP_FACTOR = 0.1;

  let frameId = null;
  let renderFrameId = null;
  let lastRenderTime = 0;
  const textData = new Map();

  heroTexts.forEach((text) => {
    const label = text.textContent?.trim() || "";
    const canvas = document.createElement("canvas");
    canvas.className = "hero-nav__canvas";
    text.dataset.text = label;
    text.setAttribute("aria-label", label);
    text.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    textData.set(text, {
      label,
      canvas,
      ctx,
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      currentIntensity: BASE_INTENSITY,
      targetIntensity: BASE_INTENSITY,
      clickBoostUntil: 0,
      width: 0,
      height: 0,
      dpr: 1,
    });
  });

  const resizeCanvas = (text, data) => {
    const dpr = window.devicePixelRatio || 1;
    const style = getComputedStyle(text);
    const fallbackFontSize = parseFloat(style.fontSize) || 32;
    const fallbackWidth =
      labelMeasureCache(data.label, style) +
      LETTER_SPACING * Math.max(0, data.label.length - 1) +
      FUZZ_RANGE * 2 +
      28;
    const fallbackHeight = Math.ceil(fallbackFontSize * 1.24) + 20;
    const rect = text.getBoundingClientRect();
    const width = Math.max(1, Math.ceil(Math.max(rect.width + 64, fallbackWidth)));
    const height = Math.max(1, Math.ceil(Math.max(rect.height + 32, fallbackHeight)));
    if (
      data.width === width &&
      data.height === height &&
      data.dpr === dpr
    ) {
      return;
    }

    data.width = width;
    data.height = height;
    data.dpr = dpr;
    data.canvas.width = Math.round(width * dpr);
    data.canvas.height = Math.round(height * dpr);
    data.canvas.style.width = `${width}px`;
    data.canvas.style.height = `${height}px`;
    data.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const labelMeasureCache = (label, style) => {
    const probe = document.createElement("canvas");
    const probeCtx = probe.getContext("2d");
    if (!probeCtx) return label.length * 18;
    probeCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return probeCtx.measureText(label).width;
  };

  const drawFuzzyText = (text, data) => {
    if (!data.ctx) return;

    resizeCanvas(text, data);

    const { ctx, width, height, label } = data;
    const style = getComputedStyle(text);
    const intensityBoost =
      CLICK_EFFECT && performance.now() < data.clickBoostUntil ? 0.18 : 0;
    const targetIntensity = Math.min(
      0.58,
      data.targetIntensity + intensityBoost
    );
    data.currentIntensity +=
      (targetIntensity - data.currentIntensity) * 0.24;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(16, 10);
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.letterSpacing = `${LETTER_SPACING}px`;

    const textWidth = labelMeasureCache(label, style);
    const glyphWidth = Math.ceil(
      textWidth + LETTER_SPACING * Math.max(0, label.length - 1)
    );
    const drawWidth = Math.ceil(glyphWidth + FUZZ_RANGE * 2 + 18);
    const drawHeight = Math.ceil(parseFloat(style.fontSize) * 1.12);

    const offscreen = document.createElement("canvas");
    offscreen.width = Math.max(1, Math.ceil(drawWidth * data.dpr));
    offscreen.height = Math.max(1, Math.ceil(drawHeight * data.dpr));
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) {
      ctx.restore();
      return;
    }
    offCtx.setTransform(data.dpr, 0, 0, data.dpr, 0, 0);
    offCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    offCtx.textBaseline = "top";
    offCtx.textAlign = "left";
    offCtx.letterSpacing = `${LETTER_SPACING}px`;
    offCtx.fillStyle = "#ffffff";
    offCtx.fillText(label, 0, 0);

    const sliceHeight = GLITCH_MODE ? 3 : 5;
    const maxOffset = FUZZ_RANGE * data.currentIntensity;

    for (let y = 0; y < drawHeight; y += sliceHeight) {
      const bandHeight = Math.min(sliceHeight, drawHeight - y);
      const offsetX = (Math.random() * 2 - 1) * maxOffset;
      const alpha = 0.68 + Math.random() * 0.32;
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        offscreen,
        0,
        Math.round(y * data.dpr),
        Math.round(glyphWidth * data.dpr),
        Math.round(bandHeight * data.dpr),
        offsetX,
        y,
        glyphWidth,
        bandHeight
      );
    }

    ctx.globalAlpha = 0.9;
    ctx.shadowColor = "rgba(255,255,255,0.18)";
    ctx.shadowBlur = 2;
    ctx.drawImage(
      offscreen,
      0,
      0,
      Math.round(glyphWidth * data.dpr),
      offscreen.height,
      0,
      0,
      glyphWidth,
      drawHeight
    );
    ctx.restore();
  };

  const renderTexts = (time) => {
    const frameInterval = 1000 / FPS;
    if (!lastRenderTime || time - lastRenderTime >= frameInterval) {
      heroTexts.forEach((text) => {
        const data = textData.get(text);
        if (!data) return;
        drawFuzzyText(text, data);
      });
      lastRenderTime = time;
    }
    renderFrameId = requestAnimationFrame(renderTexts);
  };

  const handleMouseMove = (e) => {
    heroTexts.forEach((text) => {
      const rect = text.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const data = textData.get(text);
      data.targetX = (e.clientX - centerX) * 0.03;
      data.targetY = (e.clientY - centerY) * 0.03;
    });

    if (!frameId) {
      frameId = requestAnimationFrame(animate);
    }
  };

  const animate = () => {
    let needsUpdate = false;

    heroTexts.forEach((text) => {
      const data = textData.get(text);
      const dx = data.targetX - data.currentX;
      const dy = data.targetY - data.currentY;

      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        data.currentX += dx * LERP_FACTOR;
        data.currentY += dy * LERP_FACTOR;
        text.style.setProperty("--hero-float-x", `${data.currentX}px`);
        text.style.setProperty("--hero-float-y", `${data.currentY}px`);
        needsUpdate = true;
      }
    });

    frameId = needsUpdate ? requestAnimationFrame(animate) : null;
  };

  heroTexts.forEach((text) => {
    const data = textData.get(text);
    if (!data) return;
    resizeCanvas(text, data);
    drawFuzzyText(text, data);

    const setHoverState = (active) => {
      data.targetIntensity = active ? HOVER_INTENSITY : BASE_INTENSITY;
    };

    text.addEventListener("pointerenter", () => setHoverState(true));
    text.addEventListener("pointerleave", () => setHoverState(false));
    text.addEventListener("focus", () => setHoverState(true));
    text.addEventListener("blur", () => setHoverState(false));

    if (CLICK_EFFECT) {
      text.addEventListener("pointerdown", () => {
        data.clickBoostUntil = performance.now() + CLICK_BOOST_DURATION;
      });
    }
  });

  window.addEventListener("resize", () => {
    heroTexts.forEach((text) => {
      const data = textData.get(text);
      if (!data) return;
      resizeCanvas(text, data);
      drawFuzzyText(text, data);
    });
  });

  renderFrameId = requestAnimationFrame(renderTexts);
  document.addEventListener("mousemove", handleMouseMove, { passive: true });
})();

// =============================================================================
// 模块 1：导航菜单（.menu-toggle / .menu-wrap）
// =============================================================================
const menuToggle = document.getElementById("menuToggle");
const menuWrap = document.getElementById("menuWrap");
const navbar = document.querySelector(".navbar");

if (menuToggle && menuWrap) {
  const isMobileViewport = () => window.innerWidth <= 768;
  let toggleClickLock = false;
  const isMenuOpen = () => menuWrap.classList.contains("open");

  const setMenuOpen = (open) => {
    menuWrap.classList.toggle("open", open);
    syncMenuOpenState();
  };

  const syncMenuOpenState = () => {
    const isOpen = isMobileViewport() && isMenuOpen();
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleTogglePress = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (toggleClickLock) return;
    toggleClickLock = true;
    setMenuOpen(!isMenuOpen());
    window.setTimeout(() => {
      toggleClickLock = false;
    }, 0);
  };

  menuToggle.addEventListener("pointerdown", handleTogglePress);

  menuWrap.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // 点击菜单外区域时关闭，避免 body 一直处于 overflow:hidden。
  document.addEventListener("click", (event) => {
    if (!isMobileViewport()) return;
    if (!menuWrap.classList.contains("open")) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (menuWrap.contains(target) || menuToggle.contains(target)) return;
    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });

  window.addEventListener("hashchange", closeMenu);
  window.addEventListener("pageshow", syncMenuOpenState);
  syncMenuOpenState();
}

// 导航栏：仅在页面滚动后出现边框与背景（与顶部透明态区分）
const NAVBAR_SCROLL_THRESHOLD = 8;
window.NAVBAR_SCROLL_THRESHOLD = NAVBAR_SCROLL_THRESHOLD;

function updateNavbarScrolledState() {
  if (!navbar) return;
  navbar.classList.toggle(
    "navbar--scrolled",
    window.scrollY > NAVBAR_SCROLL_THRESHOLD
  );
}

if (navbar) {
  updateNavbarScrolledState();
  window.addEventListener("scroll", updateNavbarScrolledState, { passive: true });
}

// =============================================================================
// 模块 1.1：首屏角色转头 — 基于视频 contact sheet 校准帧，不做线性角度映射
// =============================================================================
(function initHeadTracker() {
  const tracker = document.querySelector("[data-head-tracker]");
  if (!tracker) return;
  const canvas = tracker.querySelector(".head-tracker__sprite");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return;

  const FRAME_COUNT = 240;
  const FRAME_COLS = 12;
  const FRAMES_PER_SHEET = 60;
  const FRAME_WIDTH = 1280;
  const FRAME_HEIGHT = 720;
  const FRONT_FRAME = 0;
  const CENTER_DEAD_ZONE = 54;
  const LOOK_CENTER_X = 0.5;
  const LOOK_CENTER_Y = 0.56;
  const ANGLE_KEYS = [
    { angle: 0, frame: 60, direction: "right", videoFrame: 150 },
    { angle: 45, frame: 75, direction: "right-down", videoFrame: 187 },
    { angle: 90, frame: 94, direction: "down", videoFrame: 237 },
    { angle: 135, frame: 114, direction: "left-down", videoFrame: 287 },
    { angle: 180, frame: 135, direction: "left", videoFrame: 338 },
    { angle: 225, frame: 156, direction: "left-up", videoFrame: 391 },
    { angle: 270, frame: 166, direction: "up", videoFrame: 416 },
    { angle: 315, frame: 45, direction: "right-up", videoFrame: 112 },
    { angle: 360, frame: 60, direction: "right", videoFrame: 150 },
  ];
  let displayedFrame = FRONT_FRAME;
  let targetFrame = FRONT_FRAME;
  let targetDirection = "center";
  let pointerRafId = 0;
  let motionRafId = 0;
  let queuedPoint = null;
  let hasPaintedFrame = false;
  const spriteSrcs = [
    "./imag/sprite.webp",
    "./imag/sprite_2.webp",
    "./imag/sprite_3.webp",
    "./imag/sprite_4.webp",
  ];

  // 优先复用预加载器已加载的图片，避免重复请求和解码
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
  const prewarmCanvas = document.createElement("canvas");
  prewarmCanvas.width = FRAME_WIDTH;
  prewarmCanvas.height = FRAME_HEIGHT;
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
    const sheetIndex = Math.floor(frame / FRAMES_PER_SHEET);
    const sheetFrame = frame % FRAMES_PER_SHEET;
    const spriteSource = spriteBitmaps.get(sheetIndex) || spriteImages[sheetIndex];
    if (!spriteSource || !spriteReady.has(sheetIndex)) return;
    prewarmContext.drawImage(
      spriteSource,
      (sheetFrame % FRAME_COLS) * FRAME_WIDTH,
      Math.floor(sheetFrame / FRAME_COLS) * FRAME_HEIGHT,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      0,
      0,
      FRAME_WIDTH,
      FRAME_HEIGHT
    );
  };

  const normalizeFrame = (frame) => {
    return ((Math.round(frame) % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
  };

  const interpolateFrame = (fromFrame, toFrame, t) => {
    let delta = toFrame - fromFrame;
    if (delta > FRAME_COUNT / 2) delta -= FRAME_COUNT;
    if (delta < -FRAME_COUNT / 2) delta += FRAME_COUNT;
    return normalizeFrame(fromFrame + delta * t);
  };

  const signedFrameDelta = (fromFrame, toFrame) => {
    if (toFrame === FRONT_FRAME && fromFrame > FRONT_FRAME) {
      return -fromFrame;
    }
    let delta = toFrame - fromFrame;
    if (delta > FRAME_COUNT / 2) delta -= FRAME_COUNT;
    if (delta < -FRAME_COUNT / 2) delta += FRAME_COUNT;
    return delta;
  };

  const pickCalibratedFrame = (angle) => {
    for (let i = 0; i < ANGLE_KEYS.length - 1; i += 1) {
      const from = ANGLE_KEYS[i];
      const to = ANGLE_KEYS[i + 1];
      if (angle < from.angle || angle > to.angle) continue;
      const t = (angle - from.angle) / (to.angle - from.angle || 1);
      const frame = interpolateFrame(from.frame, to.frame, t);
      return {
        frame,
        direction:
          t < 0.34 ? from.direction : t > 0.66 ? to.direction : `${from.direction}-to-${to.direction}`,
      };
    }
    return ANGLE_KEYS[0];
  };

  const setFrame = (frame, direction) => {
    displayedFrame = normalizeFrame(frame);
    targetFrame = displayedFrame;
    targetDirection = direction;
    renderFrame(displayedFrame, direction);
  };

  const renderFrame = (frame, direction) => {
    tracker.style.setProperty("--head-frame", String(frame));
    tracker.style.setProperty("--head-col", String(frame % FRAME_COLS));
    tracker.style.setProperty("--head-row", String(Math.floor(frame / FRAME_COLS)));
    tracker.dataset.frame = String(frame);
    tracker.dataset.direction = direction;
    drawFrame(frame);
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

  const drawFrame = (frame) => {
    const sheetIndex = Math.floor(frame / FRAMES_PER_SHEET);
    const sheetFrame = frame % FRAMES_PER_SHEET;
    const spriteSource = spriteBitmaps.get(sheetIndex) || spriteImages[sheetIndex];
    if (!spriteSource || !spriteReady.has(sheetIndex)) return false;
    const col = sheetFrame % FRAME_COLS;
    const row = Math.floor(sheetFrame / FRAME_COLS);
    context.drawImage(
      spriteSource,
      col * FRAME_WIDTH,
      row * FRAME_HEIGHT,
      FRAME_WIDTH,
      FRAME_HEIGHT,
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

  const updateFromPoint = (clientX, clientY) => {
    const rect = tracker.getBoundingClientRect();
    const centerX = rect.left + rect.width * LOOK_CENTER_X;
    const centerY = rect.top + rect.height * LOOK_CENTER_Y;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance < CENTER_DEAD_ZONE) {
      setTargetFrame(FRONT_FRAME, "center");
      return;
    }

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const normalizedAngle = (angle + 360) % 360;
    const key = pickCalibratedFrame(normalizedAngle);
    setTargetFrame(key.frame, key.direction);
  };

  window.HEAD_TRACKER_ANGLE_KEYS = ANGLE_KEYS;
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
      // 已从预加载器缓存的图片无需再次 decode
      if (!isFromCache) {
        try {
          if (typeof image.decode === "function") await image.decode();
        } catch {
          // decode() can reject when the browser has already completed decode; load is enough.
        }
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
          FRAME_WIDTH,
          FRAME_HEIGHT,
          0,
          0,
          FRAME_WIDTH,
          FRAME_HEIGHT
        );
      }
      spriteReady.add(index);
      runWhenIdle(() => {
        const start = index * FRAMES_PER_SHEET;
        [0, 15, 30, 45, 59].forEach((offset) => {
          const frame = start + offset;
          if (frame < FRAME_COUNT) prewarmFrame(frame);
        });
      });
      drawFrame(displayedFrame);
    };
    image.addEventListener("load", markReady, { once: true });
    if (image.complete) markReady();
  });

  setFrame(FRONT_FRAME, "center");
  const queueUpdateFromPoint = (clientX, clientY) => {
    queuedPoint = { clientX, clientY };
    if (pointerRafId) return;
    pointerRafId = window.requestAnimationFrame(() => {
      pointerRafId = 0;
      if (!queuedPoint) return;
      updateFromPoint(queuedPoint.clientX, queuedPoint.clientY);
      queuedPoint = null;
    });
  };

  window.addEventListener(
    "pointermove",
    (event) => queueUpdateFromPoint(event.clientX, event.clientY),
    { passive: true }
  );
  window.addEventListener(
    "mousemove",
    (event) => queueUpdateFromPoint(event.clientX, event.clientY),
    { passive: true }
  );
})();

// =============================================================================
// 模块 1.5：标题悬停 — 字符弹性偏移与换色（避开首屏组合标题）
// =============================================================================
(function initPlayfulTitleHover() {
  const titleSelectors = [
    ".photo-top",
    ".portfolio-top",
    ".portfolio-featured__head h2",
  ];

  document.querySelectorAll(titleSelectors.join(",")).forEach((title) => {
    if (title.dataset.playTitleReady === "true") return;

    const originalText = title.textContent || "";
    const accessibleText = originalText.replace(/\s+/g, " ").trim();
    if (!accessibleText) return;

    title.dataset.playTitleReady = "true";
    title.classList.add("play-title");
    title.setAttribute("aria-label", accessibleText);

    const fragment = document.createDocumentFragment();
    const isPhotoTitle = title.matches(".photo-top");
    const isPortfolioTitle = title.matches(".portfolio-top");
    const isFeaturedTitle = title.matches(".portfolio-featured__head h2");
    let charIndex = 0;
    let iCountForPortfolio = 0;

    Array.from(title.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === "BR") {
        fragment.appendChild(document.createElement("br"));
        return;
      }

      const text = node.textContent || "";
      Array.from(text).forEach((char) => {
        if (char === "\n") return;

        if (isPhotoTitle && char === "O") {
          const sticker = document.createElement("span");
          const stickerImage = document.createElement("img");

          sticker.className =
            "play-title__sticker play-title__sticker--work-face";
          sticker.setAttribute("aria-hidden", "true");
          sticker.style.setProperty("--title-char-index", String(charIndex));
          sticker.style.setProperty(
            "--title-char-drift",
            `${(charIndex % 5) - 2}px`
          );
          sticker.style.setProperty(
            "--title-char-rotate",
            `${[-5, 4, -2, 5, -4, 3][charIndex % 6]}deg`
          );
          stickerImage.src = "./imag/Group 1940699207.png";
          stickerImage.alt = "";
          sticker.appendChild(stickerImage);
          fragment.appendChild(sticker);
          charIndex += 1;
          return;
        }

        if (isPortfolioTitle && char === "I") {
          iCountForPortfolio++;
          if (iCountForPortfolio === 2) {
            const group = document.createElement("span");
            const charSpan = document.createElement("span");
            const sticker = document.createElement("span");
            const stickerImage = document.createElement("img");

            group.className = "play-title__fire-group";
            group.style.setProperty("--title-char-index", String(charIndex));
            group.style.setProperty("--title-char-drift", `${(charIndex % 5) - 2}px`);
            group.style.setProperty(
              "--title-char-rotate",
              `${[-5, 4, -2, 5, -4, 3][charIndex % 6]}deg`
            );

            charSpan.className = "play-title__char play-title__char--fire-anchor";
            charSpan.setAttribute("aria-hidden", "true");
            charSpan.textContent = char;

            sticker.className =
              "play-title__sticker play-title__sticker--light-bulb";
            sticker.setAttribute("aria-hidden", "true");
            stickerImage.src = "./imag/灯泡 1.png";
            stickerImage.alt = "";
            sticker.appendChild(stickerImage);
            group.append(charSpan, sticker);
            fragment.appendChild(group);
            charIndex += 1;
            return;
          }
        }

        if (isFeaturedTitle && char === "I") {
          const group = document.createElement("span");
          const charSpan = document.createElement("span");
          const sticker = document.createElement("span");
          const stickerImage = document.createElement("img");

          group.className = "play-title__fire-group";
          group.style.setProperty("--title-char-index", String(charIndex));
          group.style.setProperty("--title-char-drift", `${(charIndex % 5) - 2}px`);
          group.style.setProperty(
            "--title-char-rotate",
            `${[-5, 4, -2, 5, -4, 3][charIndex % 6]}deg`
          );

          charSpan.className = "play-title__char play-title__char--fire-anchor";
          charSpan.setAttribute("aria-hidden", "true");
          charSpan.textContent = char;

          sticker.className =
            "play-title__sticker play-title__sticker--design-fire";
          sticker.setAttribute("aria-hidden", "true");
          stickerImage.src = "./imag/Group 1940699208.png";
          stickerImage.alt = "";
          sticker.appendChild(stickerImage);
          group.append(charSpan, sticker);
          fragment.appendChild(group);
          charIndex += 1;
          return;
        }

        const span = document.createElement("span");
        span.className =
          char.trim() === "" ? "play-title__space" : "play-title__char";
        span.setAttribute("aria-hidden", "true");
        span.textContent = char === " " ? "\u00a0" : char;
        span.style.setProperty("--title-char-index", String(charIndex));
        span.style.setProperty("--title-char-drift", `${(charIndex % 5) - 2}px`);
        span.style.setProperty(
          "--title-char-rotate",
          `${[-5, 4, -2, 5, -4, 3][charIndex % 6]}deg`
        );
        fragment.appendChild(span);
        if (char.trim() !== "") charIndex += 1;
      });
    });

    title.replaceChildren(fragment);

    const updateTitleHover = (event) => {
      const hoverTargets = title.querySelectorAll(
        ".play-title__char, .play-title__sticker--work-face"
      );
      const isOverText = Array.from(hoverTargets).some((target) => {
        const rect = target.getBoundingClientRect();
        return (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        );
      });

      title.classList.toggle("is-hovering", isOverText);
    };

    title.addEventListener("pointermove", updateTitleHover);
    title.addEventListener("mousemove", updateTitleHover);
    title.addEventListener("pointerleave", () => {
      title.classList.remove("is-hovering");
    });
    title.addEventListener("mouseleave", () => {
      title.classList.remove("is-hovering");
    });
  });
})();

// =============================================================================
// 模块 2：锚点平滑滚动（a[href^="#"]）
// =============================================================================
/** 与顶栏实际占位一致：小屏为 fixed，大屏为 sticky，均用布局测量避免与 CSS 脱节 */
function getAnchorOffset() {
  if (!navbar) return 96;
  const r = navbar.getBoundingClientRect();
  const breathe = window.innerWidth <= 768 ? 8 : 24;
  return r.bottom + breathe;
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const href = anchor.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset;
    const y = Math.max(0, targetTop - getAnchorOffset());

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  });
});

// =============================================================================
// 模块 3：技能 Logo 墙 — 2D 简易物理（重力 + 边界 + 粒子碰撞）
// =============================================================================
const logoWall = document.querySelector(".logo-wall");
let physicsStarted = false;
let physicsRafId = null;
let logoParticles = [];

/** 随机数，用于初始位置与速度抖动 */
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

/** 读取当前 CSS 下图标边长，供碰撞与边界计算 */
function getLogoSize() {
  if (!logoWall) return 64;
  const first = logoWall.querySelector("img");
  if (!first) return 64;
  const width = parseFloat(window.getComputedStyle(first).width);
  return Number.isFinite(width) && width > 0 ? width : 64;
}

/** 两两粒子弹性分离 + 冲量，减少图标重叠 */
function resolveLogoCollisions(particles, size) {
  const minDist = size * 0.86;
  const restitution = 0.32;

  for (let i = 0; i < particles.length; i += 1) {
    const a = particles[i];
    if (!a.active) continue;

    for (let j = i + 1; j < particles.length; j += 1) {
      const b = particles[j];
      if (!b.active) continue;

      const ax = a.x + size * 0.5;
      const ay = a.y + size * 0.5;
      const bx = b.x + size * 0.5;
      const by = b.y + size * 0.5;

      const dx = bx - ax;
      const dy = by - ay;
      const distSq = dx * dx + dy * dy;
      if (distSq === 0) continue;

      const dist = Math.sqrt(distSq);
      if (dist >= minDist) continue;

      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;

      // 先分离位置，防止图标重叠穿透。
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      // 再做速度冲量，形成“碰撞后分开”的牛顿感。
      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const velAlongNormal = rvx * nx + rvy * ny;
      if (velAlongNormal > 0) continue;

      const impulse = (-(1 + restitution) * velAlongNormal) / 2;
      const ix = impulse * nx;
      const iy = impulse * ny;

      a.vx -= ix;
      a.vy -= iy;
      b.vx += ix;
      b.vy += iy;
    }
  }
}

/** 按容器宽度铺排初始 x，从上方随机高度落下，写入 logoParticles */
function setupLogoParticles() {
  if (!logoWall) return;

  const logos = Array.from(logoWall.querySelectorAll("img"));
  if (!logos.length) {
    logoParticles = [];
    return;
  }

  const wallWidth = logoWall.clientWidth;
  const wallHeight = logoWall.clientHeight;
  const isMobile = window.innerWidth <= 768;
  const size = getLogoSize();
  const edgeSafe = isMobile ? 6 : 14;
  const floorSafe = isMobile ? 20 : 44;
  const usableWidth = wallWidth - size - edgeSafe * 2;
  const step = usableWidth / Math.max(logos.length - 1, 1);
  const baseGround = wallHeight - size - floorSafe;

  logoParticles = logos.map((el, index) => {
    const jitter = isMobile ? randomInRange(-11, 11) : randomInRange(-18, 18);
    const x = Math.max(
      edgeSafe,
      Math.min(wallWidth - size - edgeSafe, edgeSafe + index * step + jitter)
    );
    const ground = baseGround;
    const angle = randomInRange(-26, 26);
    // 起始高度随容器高度变化，移动端略轻、避免窄屏横向挤出
    const startY = isMobile
      ? -Math.min(240, wallHeight * 0.72) - randomInRange(0, 56)
      : -280 - randomInRange(0, 120);

    el.style.opacity = "0";
    el.style.transform = `translate3d(${x}px, ${startY}px, 0) rotate(${angle}deg)`;

    return {
      el,
      x,
      y: startY,
      vx: randomInRange(-20, 20),
      vy: randomInRange(0, 20),
      angle,
      av: randomInRange(-120, 120),
      ground,
      delay: randomInRange(0, 0.75),
      active: false,
      settled: false,
    };
  });
}

/** 启动 rAF 主循环：重力、地面反弹、静止判定，结束时停止帧循环 */
function startLogoPhysics() {
  if (!logoWall || physicsStarted || !logoParticles.length) return;
  physicsStarted = true;

  const isMobile = window.innerWidth <= 768;
  const gravity = isMobile ? 1800 : 2100;
  const bounce = isMobile ? 0.34 : 0.38;
  const drag = 0.996;
  const sideDamp = 0.55;
  const rotationDamp = 0.88;
  const wallWidth = logoWall.clientWidth;
  const size = getLogoSize();
  const edgeSafe = isMobile ? 6 : 14;
  const floorSafe = isMobile ? 20 : 44;
  const floorY = logoWall.clientHeight - size - floorSafe;
  let elapsed = 0;
  let lastTs = 0;

  const tick = (ts) => {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    elapsed += dt;

    let allSettled = true;

    logoParticles.forEach((p) => {
      if (!p.active && elapsed >= p.delay) {
        p.active = true;
        p.el.style.opacity = "1";
      }

      if (!p.active) {
        allSettled = false;
        return;
      }

      if (p.settled) {
        return;
      }

      p.vy += gravity * dt;
      p.vx *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.av * dt;

      if (p.x < edgeSafe) {
        p.x = edgeSafe;
        p.vx *= -sideDamp;
      } else if (p.x > wallWidth - size - edgeSafe) {
        p.x = wallWidth - size - edgeSafe;
        p.vx *= -sideDamp;
      }

      if (p.y >= p.ground) {
        p.y = p.ground;
        p.vy *= -bounce;
        p.vx *= 0.9;
        p.av *= rotationDamp;

        if (Math.abs(p.vy) < 24) {
          p.vy = 0;
          p.av *= 0.7;
        }
      }

      if (Math.abs(p.vx) < 3 && Math.abs(p.vy) < 3 && Math.abs(p.y - p.ground) < 0.5) {
        p.vx = 0;
        p.vy = 0;
        p.av = 0;
        p.y = p.ground;
        p.settled = true;
      } else {
        allSettled = false;
      }

      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.angle.toFixed(2)}deg)`;
    });

    // 迭代两次，提升“堆叠稳定性”，避免 logo 互相穿透重叠。
    resolveLogoCollisions(logoParticles, size);
    resolveLogoCollisions(logoParticles, size);

    // 碰撞后再做一轮边界回收，防止被挤出墙或地面。
    logoParticles.forEach((p) => {
      if (!p.active) return;

      if (p.x < edgeSafe) p.x = edgeSafe;
      if (p.x > wallWidth - size - edgeSafe) p.x = wallWidth - size - edgeSafe;
      if (p.y > floorY) p.y = floorY;

      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.angle.toFixed(2)}deg)`;
    });

    if (!allSettled) {
      physicsRafId = requestAnimationFrame(tick);
    } else {
      physicsRafId = null;
    }
  };

  physicsRafId = requestAnimationFrame(tick);

  setTimeout(() => {
    logoParticles.forEach((p) => {
      if (!p.settled) p.el.style.opacity = "1";
    });
  }, 120);
}

// --- 模块 3（续）：何时启动物理 — 每次进入视口都重播 + resize 重置 ---
if (logoWall) {
  setupLogoParticles();

  const restartLogoPhysics = () => {
    if (physicsRafId) {
      cancelAnimationFrame(physicsRafId);
      physicsRafId = null;
    }
    physicsStarted = false;
    setupLogoParticles();
    startLogoPhysics();
  };

  let hasPlayedInCurrentViewport = false;
  let hasPlayedOnceOnMobile = false;
  let isAnimating = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const isMobileViewport = window.innerWidth <= 768;
        if (entry.isIntersecting) {
          // 如果正在动画中，不要重复触发
          if (isAnimating) return;

          // 移动端：只播放一次，后续再次进入不重播。
          if (isMobileViewport) {
            if (hasPlayedOnceOnMobile) return;
            hasPlayedOnceOnMobile = true;
            isAnimating = true;
            restartLogoPhysics();
            return;
          }

          // 桌面端：只播放一次，后续再次进入不重播。
          if (!hasPlayedInCurrentViewport) {
            hasPlayedInCurrentViewport = true;
            isAnimating = true;
            restartLogoPhysics();
          }
        }
      });
    },
    // 进入可视区再触发，避免首屏未到达时提前开始动画
    { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
  );

  observer.observe(logoWall);

  let resizeTimer;
  let lastViewportWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const currentWidth = window.innerWidth;
      const widthChanged = Math.abs(currentWidth - lastViewportWidth) > 8;
      lastViewportWidth = currentWidth;

      // 移动端滚动时浏览器 UI 伸缩会触发 resize（高度变化）。
      // 仅在宽度真实变化时重置动画，避免“滚动误触发重播”。
      if (!widthChanged) return;

      hasPlayedInCurrentViewport = false;
      restartLogoPhysics();
    }, 160);
  });
}

// =============================================================================
// 模块 4：#photo 双图揭幕（方块格子消散效果）
// =============================================================================
const initPhotoReveal = () => {
  const photoSection = document.querySelector("#photo");
  const photoImagesWrap = document.querySelector("#photo .photo-images");
  const frontPhotoImage = document.querySelector("#photo .photo-image-front");
  const photoLinkHref = photoImagesWrap?.dataset.href || "";
  const photoLinkLabel = photoImagesWrap?.dataset.linkLabel || "查看项目";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (photoSection && photoImagesWrap && frontPhotoImage && !prefersReducedMotion) {
  let revealRafId = null;

  const hoverHitbox = document.createElement('div');
  hoverHitbox.className = 'photo-hover-hitbox';
  if (photoLinkHref) {
    hoverHitbox.setAttribute("role", "link");
    hoverHitbox.setAttribute("tabindex", "0");
    hoverHitbox.setAttribute("aria-label", photoLinkLabel);
  }
  photoImagesWrap.parentNode.insertBefore(hoverHitbox, photoImagesWrap);
  hoverHitbox.appendChild(photoImagesWrap);

  const tiltSurface = document.createElement('div');
  tiltSurface.className = 'photo-tilt-surface';
  while (photoImagesWrap.firstChild) {
    tiltSurface.appendChild(photoImagesWrap.firstChild);
  }
  photoImagesWrap.appendChild(tiltSurface);
  
  // 隐藏原始的上层图片，用方块格子代替
  frontPhotoImage.style.display = 'none';
  
  // 创建方块格子容器
  const gridContainer = document.createElement('div');
  gridContainer.className = 'photo-grid-container';
  tiltSurface.appendChild(gridContainer);
  
  // 获取上层图片的 URL
  const frontImageUrl = frontPhotoImage.src;
  
  // 生成方块格子
  const gridSize = 25;
  const wrapWidth = photoImagesWrap.offsetWidth || 300;
  const wrapHeight = photoImagesWrap.offsetHeight || 400;
  const cols = Math.ceil(wrapWidth / gridSize);
  const rows = Math.ceil(wrapHeight / gridSize);
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.style.left = `${col * gridSize}px`;
      cell.style.top = `${row * gridSize}px`;
      cell.style.width = `${gridSize}px`;
      cell.style.height = `${gridSize}px`;
      cell.style.backgroundImage = `url(${frontImageUrl})`;
      cell.style.backgroundSize = `${wrapWidth}px ${wrapHeight}px`;
      cell.style.backgroundPosition = `-${col * gridSize}px -${row * gridSize}px`;
      cell.dataset.row = row;
      cell.dataset.col = col;
      gridContainer.appendChild(cell);
    }
  }

  /** 根据滚动进度实现方块格子消散效果 */
  const renderPhotoReveal = () => {
    const rect = photoSection.getBoundingClientRect();
    const vh = window.innerHeight;
    const start = vh * 0.72;
    const end = vh * -0.18;
    const progressRaw = (start - rect.top) / (start - end);
    const progress = Math.max(0, Math.min(1, progressRaw));
    const easedProgress = Math.pow(progress, 2.6);
    
    // 更新每个方块的透明度和缩放
    const cells = gridContainer.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const cellProgress = (row + col * 0.1) / rows;
      
      // 方块从下往上逐渐消失，带有随机延迟和交错效果
      const randomDelay = Math.sin(col * 0.5) * 0.1 + (Math.random() - 0.5) * 0.1;
      const adjustedProgress = cellProgress + randomDelay;
      
      if (easedProgress > adjustedProgress) {
        cell.style.opacity = 0;
        cell.style.transform = 'scale(0.6) translateY(10px)';
      } else {
        cell.style.opacity = 1;
        cell.style.transform = 'scale(1) translateY(0)';
      }
    });

    revealRafId = null;
  };

  /** 用 rAF 合并 scroll/resize，避免同一帧内重复计算 */
  const requestPhotoReveal = () => {
    if (revealRafId) return;
    revealRafId = requestAnimationFrame(renderPhotoReveal);
  };

  requestPhotoReveal();
  window.addEventListener("scroll", requestPhotoReveal, { passive: true });
  window.addEventListener("resize", requestPhotoReveal);
  
  // 添加鼠标跟随3D效果
  let rafId = null;
  let targetRotateX = 0;
  let targetRotateY = 0;
  
  const updateTransform = () => {
    photoImagesWrap.style.transform = `perspective(1000px) rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg) scale3d(${targetRotateX === 0 && targetRotateY === 0 ? 1 : 1.02}, ${targetRotateX === 0 && targetRotateY === 0 ? 1 : 1.02}, 1)`;
    rafId = null;
  };

  const resetPhotoTilt = () => {
    targetRotateX = 0;
    targetRotateY = 0;
    if (!rafId) {
      rafId = requestAnimationFrame(updateTransform);
    }
  };
  
  const handleMouseMove = (e) => {
    const rect = hoverHitbox.getBoundingClientRect();
    const edgeInset = 14;
    const isInsideStableHoverZone =
      e.clientX >= rect.left + edgeInset &&
      e.clientX <= rect.right - edgeInset &&
      e.clientY >= rect.top + edgeInset &&
      e.clientY <= rect.bottom - edgeInset;

    if (!isInsideStableHoverZone) {
      resetPhotoTilt();
      return;
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 计算鼠标相对于中心的位置（-1 到 1）并限制范围
    targetRotateX = Math.max(-12, Math.min(12, (e.clientY - centerY) / (rect.height / 2) * -12));
    targetRotateY = Math.max(-12, Math.min(12, (e.clientX - centerX) / (rect.width / 2) * 12));
    
    if (!rafId) {
      rafId = requestAnimationFrame(updateTransform);
    }
  };
  
  hoverHitbox.addEventListener('mousemove', handleMouseMove);
  hoverHitbox.addEventListener('mouseleave', resetPhotoTilt);

  if (photoLinkHref) {
    const openPhotoProject = () => {
      window.location.assign(photoLinkHref);
    };

    hoverHitbox.addEventListener("click", (event) => {
      event.preventDefault();
      openPhotoProject();
    });

    hoverHitbox.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openPhotoProject();
    });
  }
  }
}

// 确保DOM完全加载后再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhotoReveal);
} else {
  initPhotoReveal();
}

// =============================================================================
// 模块 5：工作经历 — 悬停行时大图跟随指针（GSAP quickTo，需 gsap.min.js）
// =============================================================================
// =============================================================================
// 模块 7：作品 — 无限卡片（CodePen RwKwLWK 核心逻辑：wrapTime + seamlessLoop；
// 本站无 ScrollTrigger pin，保留横向滚轮与独立 drag-hit；类名 portfolio-*）
// =============================================================================
(function initPortfolioInfiniteCards() {
  if (typeof gsap === "undefined") return;
  if (typeof Draggable === "undefined") return;

  const root = document.querySelector(".portfolio-cards-section");
  const gallery = document.querySelector(".portfolio-gallery");
  const cardsRoot = document.querySelector(".portfolio-cards");
  if (!root || !gallery || !cardsRoot) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) {
    root.classList.add("portfolio-cards-section--reduced");
    return;
  }

  gsap.registerPlugin(Draggable);

  const cards = gsap.utils.toArray(".portfolio-cards li");
  if (!cards.length) return;
  const isNarrowScreen = window.matchMedia("(max-width: 768px)").matches;

  /**
   * 两侧：明显更小 + 更淡。中间仅在横移的一小段保持 1，否则邻居卡会长时间处在
   * scale 插值中段，看起来「都一样大」。
   */
  const edgeScale = 0.18;
  const edgeOpacity = 0.18;

  gsap.set(cards, {
    xPercent: 400,
    opacity: edgeOpacity,
    scale: edgeScale,
    transformOrigin: "50% 50%",
    force3D: true,
  });

  const spacing = 0.1;
  const snapTime = gsap.utils.snap(spacing);

  const animateFunc = (element) => {
    const tl = gsap.timeline();
    tl.fromTo(
      element,
      { xPercent: 400 },
      {
        xPercent: -400,
        duration: 1,
        ease: "none",
        immediateRender: false,
        force3D: true,
      },
      0
    );
    /* 0.00–0.34：保持两侧小+淡；0.34–0.50：抬到中间大+实；0.50–1.00：再收回两侧 */
    tl.fromTo(
      element,
      { scale: edgeScale, opacity: edgeOpacity, zIndex: 1 },
      {
        scale: edgeScale,
        opacity: edgeOpacity,
        zIndex: 1,
        duration: 0.34,
        ease: "none",
        immediateRender: false,
        force3D: true,
      },
      0
    );
    tl.to(
      element,
      {
        scale: 1,
        opacity: 1,
        zIndex: 100,
        duration: 0.16,
        ease: "power2.out",
        immediateRender: false,
        force3D: true,
      },
      0.34
    );
    tl.to(
      element,
      {
        scale: edgeScale,
        opacity: edgeOpacity,
        zIndex: 1,
        duration: 0.16,
        ease: "power2.in",
        immediateRender: false,
        force3D: true,
      },
      0.5
    );
    tl.to(
      element,
      {
        scale: edgeScale,
        opacity: edgeOpacity,
        duration: 0.34,
        ease: "none",
        immediateRender: false,
        force3D: true,
      },
      0.66
    );
    return tl;
  };

  const seamlessLoop = buildSeamlessLoop(cards, spacing, animateFunc);
  const loopDur = seamlessLoop.duration();
  if (!Number.isFinite(loopDur) || loopDur <= 0) return;
  /** CodePen：任意 offset → 映射到 timeline 合法 time */
  const wrapTime = gsap.utils.wrap(0, loopDur);

  const playhead = { offset: 0 };
  let portfolioBtnTween = null;
  let portfolioSettleTween = null;

  function syncLoopToPlayhead() {
    seamlessLoop.time(wrapTime(playhead.offset));
  }

  /** 与 Demo 一致：snap(spacing) 对齐步进，减少浮点误差导致的环接缝跳帧 */
  function scrollToOffset(offset) {
    const snapped = snapTime(offset);
    playhead.offset = Math.round(snapped / spacing) * spacing;
    syncLoopToPlayhead();
  }

  /** 拖拽/滚轮结束后缓动归位，避免“瞬间跳到卡位” */
  function settleToNearestOffset(offset, duration = 0.32) {
    const target = Math.round(snapTime(offset) / spacing) * spacing;
    if (portfolioSettleTween) {
      portfolioSettleTween.kill();
      portfolioSettleTween = null;
    }
    const proxy = { v: playhead.offset };
    portfolioSettleTween = gsap.to(proxy, {
      v: target,
      duration,
      ease: "power3.out",
      overwrite: "auto",
      onUpdate: () => {
        playhead.offset = proxy.v;
        syncLoopToPlayhead();
      },
      onComplete: () => {
        playhead.offset = target;
        syncLoopToPlayhead();
        portfolioSettleTween = null;
      },
    });
  }

  function stepCarouselByButton(delta) {
    if (portfolioBtnTween) {
      portfolioBtnTween.kill();
      portfolioBtnTween = null;
    }
    if (portfolioSettleTween) {
      portfolioSettleTween.kill();
      portfolioSettleTween = null;
    }
    if (!Number.isFinite(loopDur) || loopDur <= 0) return;

    const start = playhead.offset;
    const proxy = { v: start };

    portfolioBtnTween = gsap.to(proxy, {
      v: start + delta,
      duration: 0.45,
      ease: "none",
      overwrite: "auto",
      onUpdate: () => {
        playhead.offset = proxy.v;
        syncLoopToPlayhead();
      },
      onComplete: () => {
        portfolioBtnTween = null;
        settleToNearestOffset(proxy.v, 0.28);
      },
    });
  }

  function getHorizontalWheelDelta(e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return e.deltaX;
    if (e.shiftKey && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) return e.deltaY;
    return 0;
  }

  function isPureVerticalWheel(e) {
    if (e.shiftKey) return false;
    return Math.abs(e.deltaY) > Math.abs(e.deltaX) * 1.15;
  }

  if (!isNarrowScreen) {
    let wheelSettleTimer = null;
    gallery.addEventListener(
      "wheel",
      (e) => {
        if (isPureVerticalWheel(e)) return;
        const dh = getHorizontalWheelDelta(e);
        if (Math.abs(dh) < 0.25) return;
        e.preventDefault();
        playhead.offset -= dh * 0.0011;
        syncLoopToPlayhead();
        if (wheelSettleTimer) clearTimeout(wheelSettleTimer);
        wheelSettleTimer = setTimeout(() => {
          settleToNearestOffset(playhead.offset, 0.3);
        }, 90);
      },
      { passive: false }
    );
  }

  const prevBtn = document.querySelector(".portfolio-prev");
  const nextBtn = document.querySelector(".portfolio-next");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => stepCarouselByButton(-spacing));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => stepCarouselByButton(spacing));
  }

  const dragHit = document.querySelector(".portfolio-drag-hit");
  if (dragHit) {
    Draggable.create(".portfolio-drag-proxy", {
      type: "x",
      trigger: dragHit,
      minimumMovement: 2,
      onPress() {
        window.__portfolioBounceDragging = false;
        if (portfolioBtnTween) {
          portfolioBtnTween.kill();
          portfolioBtnTween = null;
        }
        if (portfolioSettleTween) {
          portfolioSettleTween.kill();
          portfolioSettleTween = null;
        }
        this.startOffset = playhead.offset;
      },
      onDrag() {
        window.__portfolioBounceDragging = true;
        playhead.offset = this.startOffset + (this.startX - this.x) * 0.001;
        syncLoopToPlayhead();
      },
      onDragEnd() {
        settleToNearestOffset(playhead.offset, 0.34);
        window.setTimeout(() => {
          window.__portfolioBounceDragging = false;
        }, 0);
      },
    });
  }

  scrollToOffset(0);

  function buildSeamlessLoop(items, spacing, animateFunc) {
    const overlap = Math.ceil(1 / spacing);
    const startTime = items.length * spacing + 0.5;
    const loopTime = (items.length + overlap) * spacing + 1;
    const rawSequence = gsap.timeline({ paused: true });
    const seamlessLoop = gsap.timeline({
      paused: true,
      repeat: -1,
      onRepeat() {
        if (this._time === this._dur) {
          this._tTime += this._dur - 0.01;
        }
      },
    });
    const l = items.length + overlap * 2;
    let time;
    let i;
    let index;

    for (i = 0; i < l; i++) {
      index = i % items.length;
      time = i * spacing;
      rawSequence.add(animateFunc(items[index]), time);
      if (i <= items.length) {
        seamlessLoop.add("label" + i, time);
      }
    }

    rawSequence.time(startTime);
    seamlessLoop
      .to(rawSequence, {
        time: loopTime,
        duration: loopTime - startTime,
        ease: "none",
      })
      .fromTo(
        rawSequence,
        { time: overlap * spacing + 1 },
        {
          time: startTime,
          duration: startTime - (overlap * spacing + 1),
          immediateRender: false,
          ease: "none",
        }
      );

    return seamlessLoop;
  }
})();

// =============================================================================
// 模块 7.5：作品对比版 — Featured Work 风格舞台（保留原轮播用于对比）
// =============================================================================
(function initPortfolioFeaturedShowcase() {
  const root = document.querySelector(".portfolio-featured");
  if (!root) return;

  const stage = root.querySelector(".portfolio-featured__stage");
  const titleLink = root.querySelector(".portfolio-featured__title");
  const prevButton = root.querySelector(".portfolio-featured__nav--prev");
  const nextButton = root.querySelector(".portfolio-featured__nav--next");
  if (!stage) return;

  const items = Array.from(stage.querySelectorAll("[data-featured-card]")).map(
    (card, index) => {
      const image = card.querySelector("img");
      return {
        index,
        title: card.dataset.title || `Project ${index + 1}`,
        href: card.dataset.href || "#portfolio",
        src: image?.getAttribute("src") || "",
        alt: image?.getAttribute("alt") || "",
      };
    }
  );
  if (!items.length) return;

  const loopCopies = 15;
  const loopMiddle = Math.floor(loopCopies / 2);
  let activeSlot = loopMiddle * items.length;
  let isAnimating = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialActiveSlot = activeSlot;
  let touchStartX = 0;
  let touchStartY = 0;
  let isPointerDown = false;
  let dragMoved = false;
  let dragAxis = "";
  let wheelResetTimer = null;
  let motionFrame = null;
  let stepFallbackTimer = null;
  let gestureActiveTimer = null;

  const wrapIndex = (index) => (index + items.length) % items.length;
  const getSlotPitch = () => {
    if (cells.length < 2) return cells[0]?.offsetWidth || 1;
    return cells[1].offsetLeft - cells[0].offsetLeft || cells[0].offsetWidth || 1;
  };

  stage.innerHTML = "";
  const track = document.createElement("div");
  track.className = "portfolio-featured__track";
  stage.appendChild(track);

  const cells = Array.from({ length: items.length * loopCopies }, (_, slot) => {
    const item = items[wrapIndex(slot)];
    const cell = document.createElement("a");
    cell.className = "portfolio-featured__cell";
    cell.dataset.slot = String(slot);
    cell.dataset.itemIndex = String(item.index);
    cell.dataset.href = item.href;
    cell.dataset.title = item.title;
    cell.href = item.href;
    cell.target = "_blank";
    cell.rel = "noopener noreferrer";
    cell.setAttribute("aria-label", `查看 ${item.title}`);
    cell.innerHTML =
      '<span class="portfolio-featured__tilt"><span class="portfolio-featured__media"><img alt="" /></span></span><span class="portfolio-featured__badge"></span>';
    const image = cell.querySelector("img");
    const badge = cell.querySelector(".portfolio-featured__badge");
    if (image) {
      image.setAttribute("src", item.src);
      image.setAttribute("alt", item.alt);
    }
    if (badge) {
      badge.textContent = item.title;
    }
    track.appendChild(cell);
    return cell;
  });

  function updateCellStates() {
    const roundedSlot = Math.round(activeSlot);
    root.dataset.activeIndex = String(wrapIndex(roundedSlot));
    const activeItem = items[wrapIndex(roundedSlot)];
    if (titleLink && activeItem) {
      titleLink.href = activeItem.href;
      titleLink.textContent = activeItem.title;
    }
    cells.forEach((cell, slot) => {
      const offset = slot - activeSlot;
      const roundedOffset = slot - roundedSlot;
      cell.classList.toggle("is-active", roundedOffset === 0);
      cell.classList.toggle("is-prev", roundedOffset === -1);
      cell.classList.toggle("is-next", roundedOffset === 1);
      cell.classList.toggle("is-near", Math.abs(roundedOffset) === 2);
      cell.classList.toggle("is-far", Math.abs(roundedOffset) > 2);
      cell.style.setProperty("--featured-cell-offset", String(offset));
    });
  }

  function updateCellMotion() {
    const slotPitch = getSlotPitch();
    const isMobileViewport = window.innerWidth <= 768;
    cells.forEach((cell, slot) => {
      const offset = slot - activeSlot;
      const distance = offset * slotPitch;
      const rotationStrength = isMobileViewport ? 0.056 : 0.042;
      const rotationLimit = isMobileViewport ? 32 : 25;
      const curveBase = isMobileViewport ? 10 : 6;
      const curveStrength = isMobileViewport ? 96 : 66;
      const curveRange = isMobileViewport ? 420 : 560;
      const rotation = Math.max(
        -rotationLimit,
        Math.min(rotationLimit, distance * rotationStrength)
      );
      const normalizedDistance = Math.min(1.35, Math.abs(distance) / curveRange);
      const curveY = curveBase + normalizedDistance * normalizedDistance * curveStrength;
      const badgeOpacity = Math.max(0, Math.min(1, Math.cos(distance * Math.PI / 600)));
      const badgeY = (1 - badgeOpacity) * 14;
      const badgeScale = 0.94 + badgeOpacity * 0.06;
      const badgeBlur = (1 - badgeOpacity) * 0.8;

      cell.style.setProperty("--featured-rotation", `${rotation.toFixed(3)}deg`);
      cell.style.setProperty("--featured-curve-y", `${curveY.toFixed(3)}px`);
      cell.style.setProperty("--featured-badge-opacity", badgeOpacity.toFixed(3));
      cell.style.setProperty("--featured-badge-y", `${badgeY.toFixed(3)}px`);
      cell.style.setProperty("--featured-badge-scale", badgeScale.toFixed(3));
      cell.style.setProperty("--featured-badge-blur", `${badgeBlur.toFixed(3)}px`);
    });
  }

  function startMotionLoop(duration = 960) {
    if (motionFrame) {
      window.cancelAnimationFrame(motionFrame);
    }
    const endAt = performance.now() + duration;
    const tick = () => {
      updateCellMotion();
      if (performance.now() < endAt) {
        motionFrame = window.requestAnimationFrame(tick);
      } else {
        motionFrame = null;
        updateCellMotion();
      }
    };
    tick();
  }

  function centerActiveCell(animate = true) {
    const baseSlot = Math.floor(activeSlot);
    const activeCell = cells[baseSlot];
    if (!activeCell) return;
    updateCellStates();
    const slotProgress = activeSlot - baseSlot;
    const activeCenter =
      activeCell.offsetLeft + activeCell.offsetWidth / 2 + slotProgress * getSlotPitch();
    const stageCenter = stage.clientWidth / 2;
    const isMobileViewport = window.innerWidth <= 768;
    const transitionDuration = isMobileViewport ? "0.74s" : "1.05s";
    const transitionEase = isMobileViewport
      ? "cubic-bezier(0.22, 0.98, 0.28, 1)"
      : "cubic-bezier(0.18, 1, 0.22, 1)";
    track.style.transition = animate
      ? `transform ${transitionDuration} ${transitionEase}`
      : "none";
    track.style.transform = `translate3d(${stageCenter - activeCenter}px, 0, 0)`;
    if (!animate) {
      void track.offsetWidth;
      track.style.transition = "";
    }
    startMotionLoop(animate ? 1180 : 120);
  }

  function resetLoopPosition() {
    const minSafeSlot = items.length * 3;
    const maxSafeSlot = items.length * (loopCopies - 3);
    if (activeSlot < minSafeSlot || activeSlot >= maxSafeSlot) {
      const realIndex = wrapIndex(activeSlot);
      activeSlot = loopMiddle * items.length + realIndex;
      root.classList.add("is-loop-resetting");
      centerActiveCell(false);
      window.requestAnimationFrame(() => {
        root.classList.remove("is-loop-resetting");
      });
    }
    root.classList.remove(
      "is-animating",
      "is-rolling-left",
      "is-rolling-right"
    );
    updateCellMotion();
    isAnimating = false;
  }

  function finishStep() {
    if (!isAnimating) return;
    if (stepFallbackTimer) {
      window.clearTimeout(stepFallbackTimer);
      stepFallbackTimer = null;
    }
    resetLoopPosition();
  }

  function stepFeaturedShowcase(direction) {
    if (isAnimating) return;
    isAnimating = true;
    root.classList.remove("is-rolling-left", "is-rolling-right");
    root.classList.add(
      "is-animating",
      direction > 0 ? "is-rolling-left" : "is-rolling-right"
    );

    activeSlot = Math.round(activeSlot) + direction;
    centerActiveCell(true);

    const onTrackEnd = (event) => {
      if (event.target !== track || event.propertyName !== "transform") return;
      track.removeEventListener("transitionend", onTrackEnd);
      finishStep();
    };
    track.addEventListener("transitionend", onTrackEnd);
    stepFallbackTimer = window.setTimeout(() => {
      track.removeEventListener("transitionend", onTrackEnd);
      finishStep();
    }, 1240);
  }

  cells.forEach((cell) => {
    cell.addEventListener("click", (event) => {
      if (dragMoved) {
        event.preventDefault();
      }
    });

    cell.addEventListener("pointermove", (event) => {
      if (isPointerDown || dragMoved) return;

      const rect = cell.getBoundingClientRect();
      const edgeInset = 14;
      const isInsideStableHoverZone =
        event.clientX >= rect.left + edgeInset &&
        event.clientX <= rect.right - edgeInset &&
        event.clientY >= rect.top + edgeInset &&
        event.clientY <= rect.bottom - edgeInset;

      if (!isInsideStableHoverZone) {
        cell.style.setProperty("--featured-tilt-x", "0deg");
        cell.style.setProperty("--featured-tilt-y", "0deg");
        cell.style.setProperty("--featured-tilt-scale", "1");
        return;
      }

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateX = Math.max(
        -10,
        Math.min(10, ((event.clientY - centerY) / (rect.height / 2)) * -10)
      );
      const rotateY = Math.max(
        -10,
        Math.min(10, ((event.clientX - centerX) / (rect.width / 2)) * 10)
      );
      cell.style.setProperty("--featured-tilt-x", `${rotateX.toFixed(3)}deg`);
      cell.style.setProperty("--featured-tilt-y", `${rotateY.toFixed(3)}deg`);
      cell.style.setProperty("--featured-tilt-scale", "1.02");
    });

    cell.addEventListener("pointerleave", () => {
      cell.style.setProperty("--featured-tilt-x", "0deg");
      cell.style.setProperty("--featured-tilt-y", "0deg");
      cell.style.setProperty("--featured-tilt-scale", "1");
    });
  });

  prevButton?.addEventListener("click", () => stepFeaturedShowcase(-1));
  nextButton?.addEventListener("click", () => stepFeaturedShowcase(1));

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepFeaturedShowcase(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepFeaturedShowcase(1);
    }
  });

  const setFeaturedGestureActive = () => {
    document.documentElement.classList.add("portfolio-featured-gesture-active");
    if (gestureActiveTimer) {
      window.clearTimeout(gestureActiveTimer);
    }
    gestureActiveTimer = window.setTimeout(() => {
      document.documentElement.classList.remove("portfolio-featured-gesture-active");
      gestureActiveTimer = null;
    }, 700);
  };

  const clearFeaturedGestureActive = () => {
    if (gestureActiveTimer) {
      window.clearTimeout(gestureActiveTimer);
      gestureActiveTimer = null;
    }
    if (!isPointerDown) {
      document.documentElement.classList.remove("portfolio-featured-gesture-active");
    }
  };

  root.addEventListener("pointerenter", setFeaturedGestureActive);
  root.addEventListener("pointerleave", clearFeaturedGestureActive);
  root.addEventListener("focusin", setFeaturedGestureActive);
  root.addEventListener("focusout", clearFeaturedGestureActive);

  root.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      setFeaturedGestureActive();
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    },
    { passive: true }
  );

  root.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length !== 1) return;
      const deltaX = event.touches[0].clientX - touchStartX;
      const deltaY = event.touches[0].clientY - touchStartY;
      const isHorizontalGesture =
        Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY);
      if (isHorizontalGesture && event.cancelable) {
        setFeaturedGestureActive();
        event.preventDefault();
      }
    },
    { passive: false }
  );

  root.addEventListener("pointerdown", (event) => {
    isPointerDown = true;
    dragAxis = "";
    dragMoved = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    initialActiveSlot = activeSlot;
    if (event.pointerType === "mouse") {
      dragAxis = "x";
      setFeaturedGestureActive();
      document.body.classList.add("portfolio-featured-dragging");
    }
  });

  root.addEventListener("pointermove", (event) => {
    if (!isPointerDown) return;
    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    if (!dragAxis) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX < 10 && absY < 10) return;
      if (absX > absY * 1.12) {
        dragAxis = "x";
        setFeaturedGestureActive();
        document.body.classList.add("portfolio-featured-dragging");
      } else if (absY > absX) {
        dragAxis = "y";
        clearFeaturedGestureActive();
        document.body.classList.remove("portfolio-featured-dragging");
        return;
      }
    }

    if (dragAxis !== "x") {
      return;
    }

    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      dragMoved = Math.abs(deltaX) > Math.abs(deltaY);
    }

    const dragSensitivity = window.innerWidth <= 768 ? 0.76 : 1;
    const dragProgress = deltaX / (getSlotPitch() * dragSensitivity);
    activeSlot = initialActiveSlot - dragProgress;
    centerActiveCell(false);
  });

  root.addEventListener("pointerup", (event) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    const releasedAxis = dragAxis;
    dragAxis = "";
    clearFeaturedGestureActive();
    document.body.classList.remove("portfolio-featured-dragging");

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    if (releasedAxis !== "x") {
      dragMoved = false;
      return;
    }

    root.classList.remove("is-animating", "is-rolling-left", "is-rolling-right");
    centerActiveCell(true);

    if (wheelResetTimer) {
      window.clearTimeout(wheelResetTimer);
    }
    wheelResetTimer = window.setTimeout(() => {
      resetLoopPosition();
    }, 140);

    window.setTimeout(() => {
      dragMoved = false;
    }, 0);
  });

  root.addEventListener("pointercancel", () => {
    isPointerDown = false;
    dragAxis = "";
    dragMoved = false;
    clearFeaturedGestureActive();
    document.body.classList.remove("portfolio-featured-dragging");
  });

  const handleFeaturedWheel = (event) => {
    const horizontalDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0;
    if (Math.abs(horizontalDelta) < 4 && !isAnimating) return;

    setFeaturedGestureActive();
    event.preventDefault();
    event.stopPropagation();

    if (isAnimating) return;

    activeSlot += horizontalDelta / getSlotPitch();
    root.classList.remove("is-animating", "is-rolling-left", "is-rolling-right");
    centerActiveCell(false);

    if (wheelResetTimer) {
      window.clearTimeout(wheelResetTimer);
    }
    wheelResetTimer = window.setTimeout(() => {
      resetLoopPosition();
    }, 140);
  };

  root.addEventListener("wheel", handleFeaturedWheel, {
    passive: false,
    capture: true,
  });

  window.addEventListener("resize", () => centerActiveCell(false));
  centerActiveCell(false);
})();

// =============================================================================
// 模块 8：空白点击惊喜贴纸 — 点击非交互区域时生成短暂 emoji / 文案反馈
// =============================================================================
(function initClickSurpriseBurst() {
  const shouldReduceBurstMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (shouldReduceBurstMotion) return;

  const stickerSets = [
    ["🌟", "✨", "🎨", "🪄", "💫"],
    ["⭐", "🌈", "🧠", "💡", "🎯"],
    ["🪐", "🌙", "🔥", "🎁", "🫧"],
  ];
  const messages = [
    "哇，你变帅了！",
    "好事正在发生",
    "今天也灵感满格",
    "灵感捕获成功",
  ];

  const layer = document.createElement("div");
  layer.className = "click-surprise-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  let burstIndex = 0;
  let selectionLockTimer = null;

  const lockSelectionBriefly = () => {
    document.body.classList.add("is-click-surprise-active");
    if (selectionLockTimer) {
      window.clearTimeout(selectionLockTimer);
    }
    selectionLockTimer = window.setTimeout(() => {
      document.body.classList.remove("is-click-surprise-active");
      selectionLockTimer = null;
    }, 520);
  };

  const clearCurrentSelection = () => {
    const selection = window.getSelection?.();
    if (selection && selection.rangeCount > 0) {
      selection.removeAllRanges();
    }
  };

  document.addEventListener("selectstart", (event) => {
    if (!document.body.classList.contains("is-click-surprise-active")) return;
    event.preventDefault();
  });

  document.addEventListener("pointerdown", lockSelectionBriefly, { passive: true });
  document.addEventListener("pointerup", clearCurrentSelection);

  document.addEventListener("click", (event) => {
    lockSelectionBriefly();
    clearCurrentSelection();

    const stickers = stickerSets[burstIndex % stickerSets.length];
    const bubbleText = messages[burstIndex % messages.length];
    burstIndex += 1;

    const burst = document.createElement("div");
    burst.className = "click-surprise-burst";
    burst.style.left = `${event.clientX}px`;
    burst.style.top = `${event.clientY - 28}px`;

    stickers.forEach((sticker, index) => {
      const item = document.createElement("span");
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.94;
      const distance = 28 + Math.random() * 42;
      const startX = (Math.random() - 0.5) * 22;
      const startY = (Math.random() - 0.5) * 14;
      item.className = "click-surprise-sticker";
      item.textContent = sticker;
      item.style.setProperty("--burst-start-x", `${startX}px`);
      item.style.setProperty("--burst-start-y", `${startY}px`);
      item.style.setProperty("--burst-x", `${Math.cos(angle) * distance}px`);
      item.style.setProperty(
        "--burst-y",
        `${Math.sin(angle) * distance - 24 - Math.random() * 28}px`
      );
      item.style.setProperty("--burst-rotate", `${-26 + Math.random() * 52}deg`);
      item.style.setProperty("--burst-delay", `${index * 28}ms`);
      burst.appendChild(item);
    });

    const bubble = document.createElement("span");
    bubble.className = "click-surprise-bubble";
    bubble.textContent = bubbleText;
    bubble.style.setProperty("--bubble-y", `${-58 - Math.random() * 24}px`);
    bubble.style.setProperty("--bubble-x", `${-10 + Math.random() * 20}px`);
    bubble.style.setProperty("--bubble-drift-x", `${-10 + Math.random() * 20}px`);
    bubble.style.setProperty("--bubble-rotate", `${-4 + Math.random() * 8}deg`);
    bubble.style.setProperty("--bubble-delay", "58ms");
    burst.appendChild(bubble);

    layer.appendChild(burst);
    burst.addEventListener("animationend", () => burst.remove(), { once: true });
  });
})();
