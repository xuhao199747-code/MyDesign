(function registerHeroTextFloatModule() {
  function initHeroTextFloat(options = {}) {
    const {
      heroTextFloatConfig = {},
      siteUtils = {
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
        getBooleanOption(_object, _key, fallback) {
          return fallback;
        },
      },
    } = options;
    const heroTexts = document.querySelectorAll(".hero-nav__text");
    if (!heroTexts.length) return;
    if (document.body.dataset.heroTextFloatReady === "true") return;
    document.body.dataset.heroTextFloatReady = "true";

    const FUZZ_RANGE = siteUtils.getNumberOption(heroTextFloatConfig, "fuzzRange", 21);
    const BASE_INTENSITY = siteUtils.getNumberOption(heroTextFloatConfig, "baseIntensity", 0.12);
    const HOVER_INTENSITY = siteUtils.getNumberOption(heroTextFloatConfig, "hoverIntensity", 0.11);
    const LETTER_SPACING = siteUtils.getNumberOption(heroTextFloatConfig, "letterSpacing", 2);
    const FPS = siteUtils.getNumberOption(heroTextFloatConfig, "fps", 35);
    const GLITCH_MODE = siteUtils.getBooleanOption(heroTextFloatConfig, "glitchMode", true);
    const CLICK_EFFECT = siteUtils.getBooleanOption(heroTextFloatConfig, "clickEffect", true);
    const CLICK_BOOST_DURATION = siteUtils.getNumberOption(heroTextFloatConfig, "clickBoostDuration", 320);
    const LERP_FACTOR = siteUtils.getNumberOption(heroTextFloatConfig, "lerpFactor", 0.1);
    const BURST_INTENSITY_MIN = siteUtils.getNumberOption(heroTextFloatConfig, "burstIntensityMin", 0.22);
    const BURST_INTENSITY_MAX = siteUtils.getNumberOption(heroTextFloatConfig, "burstIntensityMax", 0.52);
    const BURST_DURATION_MIN = siteUtils.getNumberOption(heroTextFloatConfig, "burstDurationMin", 420);
    const BURST_INTERVAL_MIN = siteUtils.getNumberOption(heroTextFloatConfig, "burstIntervalMin", 500);
    const BURST_INTERVAL_MAX = siteUtils.getNumberOption(heroTextFloatConfig, "burstIntervalMax", 4200);
    const MOBILE_BREAKPOINT = siteUtils.getNumberOption(heroTextFloatConfig, "mobileBreakpoint", 768);
    const MOBILE_EDGE_PADDING = siteUtils.getNumberOption(heroTextFloatConfig, "mobileEdgePadding", 6);
    const DESKTOP_EDGE_PADDING = siteUtils.getNumberOption(heroTextFloatConfig, "desktopEdgePadding", 10);
    const MOBILE_VERTICAL_PADDING = siteUtils.getNumberOption(heroTextFloatConfig, "mobileVerticalPadding", 8);
    const DESKTOP_VERTICAL_PADDING = siteUtils.getNumberOption(heroTextFloatConfig, "desktopVerticalPadding", 10);

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
        offscreen: document.createElement("canvas"),
        offCtx: null,
        targetX: 0,
        targetY: 0,
        currentX: 0,
        currentY: 0,
        currentIntensity: BASE_INTENSITY,
        targetIntensity: BASE_INTENSITY,
        clickBoostUntil: 0,
        burstUntil: 0,
        burstIntensity: 0,
        burstStrengthScale: 0.5,
        burstBias:
          Math.random() > 0.5
            ? 0.6 + Math.random() * 0.8
            : -(0.6 + Math.random() * 0.8),
        burstSliceBoost: 0,
        burstTempo: 0.018 + Math.random() * 0.04,
        burstVector: Math.random() > 0.5 ? 1 : -1,
        idlePackage: null,
        activePackage: null,
        nextBurstAt:
          performance.now() +
          (text.classList.contains("hero-nav__text--left") ? 0 : 280) +
          BURST_INTERVAL_MIN +
          Math.random() * (BURST_INTERVAL_MAX - BURST_INTERVAL_MIN),
        isHovered: false,
        width: 0,
        height: 0,
        dpr: 1,
      });
    });

    const resizeCanvas = (text, data) => {
      const dpr = window.devicePixelRatio || 1;
      const style = getComputedStyle(text);
      const isMobileViewport = window.innerWidth <= MOBILE_BREAKPOINT;
      const edgePadding = isMobileViewport
        ? MOBILE_EDGE_PADDING
        : DESKTOP_EDGE_PADDING;
      const overscan = isMobileViewport ? Math.ceil(FUZZ_RANGE * 0.75) : FUZZ_RANGE;
      const fallbackFontSize = parseFloat(style.fontSize) || 32;
      const measuredLabelWidth =
        labelMeasureCache(data.label, style) +
        LETTER_SPACING * Math.max(0, data.label.length - 1);
      const horizontalPadding = edgePadding * 2 + overscan;
      const fallbackWidth = measuredLabelWidth + horizontalPadding;
      const fallbackHeight = Math.ceil(fallbackFontSize * 1.24) + 20;
      const rect = text.getBoundingClientRect();
      const width = Math.max(1, Math.ceil(fallbackWidth));
      const height = Math.max(1, Math.ceil(Math.max(rect.height + (isMobileViewport ? 12 : 32), fallbackHeight)));
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

    const prepareOffscreenCanvas = (data, style, glyphWidth, drawHeight) => {
      const drawWidth = Math.ceil(glyphWidth + FUZZ_RANGE * 2 + 18);
      const offscreenWidth = Math.max(1, Math.ceil(drawWidth * data.dpr));
      const offscreenHeight = Math.max(1, Math.ceil(drawHeight * data.dpr));

      if (
        !data.offCtx ||
        data.offscreen.width !== offscreenWidth ||
        data.offscreen.height !== offscreenHeight
      ) {
        data.offscreen.width = offscreenWidth;
        data.offscreen.height = offscreenHeight;
        data.offCtx = data.offscreen.getContext("2d");
      }

      if (!data.offCtx) return null;

      data.offCtx.setTransform(data.dpr, 0, 0, data.dpr, 0, 0);
      data.offCtx.clearRect(0, 0, drawWidth, drawHeight);
      data.offCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      data.offCtx.textBaseline = "top";
      data.offCtx.textAlign = "left";
      data.offCtx.letterSpacing = `${LETTER_SPACING}px`;
      data.offCtx.fillStyle = "#ffffff";
      data.offCtx.fillText(data.label, 0, 0);

      return {
        offscreen: data.offscreen,
        drawWidth,
      };
    };

    const measureCache = new Map();

    const labelMeasureCache = (label, style) => {
      const cacheKey = [
        label,
        style.fontWeight,
        style.fontSize,
        style.fontFamily,
      ].join("|");
      if (measureCache.has(cacheKey)) {
        return measureCache.get(cacheKey);
      }
      const probe = document.createElement("canvas");
      const probeCtx = probe.getContext("2d");
      if (!probeCtx) return label.length * 18;
      probeCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const measuredWidth = probeCtx.measureText(label).width;
      measureCache.set(cacheKey, measuredWidth);
      return measuredWidth;
    };

    const createEffectPackage = ({
      drawHeight,
      glyphWidth,
      strength,
      direction,
      lineCount,
      lineSpread,
      shiftBase,
      alphaBase,
      key,
    }) => {
      const seeded = (seed) => {
        const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
        return value - Math.floor(value);
      };
      const baseSeed = glyphWidth * 0.17 + drawHeight * 0.31 + strength * 13.7 + key.length * 0.19;
      const anchorY = Math.round(drawHeight * (0.16 + seeded(baseSeed + 1) * 0.58));
      const scanlineClusterHeight = Math.max(
        2,
        Math.round(2 + strength * 3 + seeded(baseSeed + 2) * 2)
      );
      const lines = Array.from({ length: lineCount }, (_, index) => ({
        yOffset: (seeded(baseSeed + index * 2.1 + 3) * 2 - 1) * lineSpread,
        height: scanlineClusterHeight,
        shiftOffset: (seeded(baseSeed + index * 2.1 + 4) * 2 - 1) * (1 + strength * 2.4),
        alphaOffset: seeded(baseSeed + index * 2.1 + 5) * 0.035,
      }));
      const bands = Array.from({ length: Math.ceil(drawHeight / 2) }, (_, index) => ({
        shiftOffset: (seeded(baseSeed + index * 1.73 + 6) * 2 - 1) * (0.8 + strength * 3.2),
        yOffset: (seeded(baseSeed + index * 1.73 + 7) * 2 - 1) * (0.24 + strength * 0.8),
        stretch: 1 + (seeded(baseSeed + index * 1.73 + 8) * 0.08 - 0.04) * (0.4 + strength * 0.6),
        dropout: seeded(baseSeed + index * 1.73 + 9),
        alphaOffset: seeded(baseSeed + index * 1.73 + 10) * 0.08,
      }));
      return {
        key,
        anchorY,
        shift: direction * shiftBase,
        alpha: alphaBase,
        ghostShiftA: direction * shiftBase * 0.74,
        ghostShiftB: -direction * shiftBase * 0.52,
        ghostAlphaA: alphaBase * 0.32,
        ghostAlphaB: alphaBase * 0.18,
        lines,
        bands,
        glyphWidth,
        drawHeight,
      };
    };

    const drawFuzzyText = (text, data) => {
      if (!data.ctx) return;

      resizeCanvas(text, data);

      const { ctx, width, height, label } = data;
      const style = getComputedStyle(text);
      const isMobileViewport = window.innerWidth <= MOBILE_BREAKPOINT;
      const edgePadding = isMobileViewport
        ? MOBILE_EDGE_PADDING
        : DESKTOP_EDGE_PADDING;
      const verticalPadding = isMobileViewport
        ? MOBILE_VERTICAL_PADDING
        : DESKTOP_VERTICAL_PADDING;
      const now = performance.now();
      if (!data.isHovered && now >= data.nextBurstAt) {
        data.burstUntil = now + BURST_DURATION_MIN;
        data.burstIntensity =
          BURST_INTENSITY_MIN +
          Math.pow(Math.random(), 0.65) *
            (BURST_INTENSITY_MAX - BURST_INTENSITY_MIN);
        const burstTierRoll = Math.random();
        data.burstStrengthScale =
          burstTierRoll < 0.24
            ? 0.12 + Math.random() * 0.1
            : 0.55 + Math.random() * 0.85;
        data.burstBias =
          Math.random() > 0.5
            ? 0.45 + Math.random() * 1.35
            : -(0.45 + Math.random() * 1.35);
        data.burstSliceBoost = Math.random() * 1.1;
        data.burstTempo = 0.012 + Math.random() * 0.065;
        data.burstVector = Math.random() > 0.5 ? 1 : -1;
        data.activePackage = null;
        data.nextBurstAt =
          data.burstUntil +
          BURST_INTERVAL_MIN +
          Math.pow(Math.random(), 1.3) *
            (BURST_INTERVAL_MAX - BURST_INTERVAL_MIN) +
          Math.random() * 1400;
      }

      const burstBoost = now < data.burstUntil ? data.burstIntensity : 0;
      const intensityBoost =
        CLICK_EFFECT && now < data.clickBoostUntil ? 0.22 : 0;
      const burstActive = now < data.burstUntil;
      const isActiveGlitch = data.isHovered || burstActive || intensityBoost > 0;
      const targetIntensity = Math.min(
        0.78,
        data.targetIntensity + burstBoost + intensityBoost
      );
      data.currentIntensity = isActiveGlitch
        ? targetIntensity
        : data.currentIntensity + (targetIntensity - data.currentIntensity) * 0.16;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(0, verticalPadding);
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.letterSpacing = `${LETTER_SPACING}px`;

      const textWidth = labelMeasureCache(label, style);
      const glyphWidth = Math.ceil(
        textWidth + LETTER_SPACING * Math.max(0, label.length - 1)
      );
      const drawHeight = Math.ceil(parseFloat(style.fontSize) * 1.12);
      const isRightAligned = text.classList.contains("hero-nav__text--right");
      const drawX = isRightAligned
        ? Math.max(0, width - glyphWidth - edgePadding)
        : edgePadding;

      const prepared = prepareOffscreenCanvas(data, style, glyphWidth, drawHeight);
      if (!prepared) {
        ctx.restore();
        return;
      }
      const { offscreen } = prepared;

      const staticNoise = (seed) => {
        const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
        return value - Math.floor(value);
      };

      if (!isActiveGlitch) {
        const settleSliceHeight = 3;

        for (let y = 0; y < drawHeight; y += settleSliceHeight) {
          const bandIndex = Math.floor(y / settleSliceHeight);
          const bandHeight = Math.min(settleSliceHeight, drawHeight - y);
          const bandProgress =
            drawHeight <= settleSliceHeight ? 0 : y / (drawHeight - settleSliceHeight);
          const seed = staticNoise(y + label.length * 17 + (isRightAligned ? 11 : 5));
          const offsetX = (seed - 0.5) * (0.16 + bandProgress * 0.12);
          const offsetY = (staticNoise(y + 91) - 0.5) * 0.08;
          const widthScale = 0.999 + staticNoise(y + 31) * 0.002;
          ctx.globalAlpha = 0.97 + staticNoise(y + 93) * 0.02;
          ctx.drawImage(
            offscreen,
            0,
            Math.round(y * data.dpr),
            Math.round(glyphWidth * data.dpr),
            Math.round(bandHeight * data.dpr),
            drawX + offsetX,
            y + offsetY,
            glyphWidth * widthScale,
            bandHeight
          );
        }

        ctx.restore();
        return;
      }

      const cycle = ((now % 1600) / 1600) * Math.PI * 2;
      const sliceHeight = GLITCH_MODE
        ? burstActive || data.isHovered
          ? 2
          : 3
        : 5;
      const maxOffset = FUZZ_RANGE * data.currentIntensity;
      const burstStrength = burstActive ? data.burstStrengthScale : 0.6;
      const disassembleStrength = data.isHovered
        ? 0.92
        : burstActive
          ? 0.42 + burstStrength * 0.34
          : 0.42;
      const verticalScatter = data.isHovered
        ? 9
        : burstActive
          ? 3 + burstStrength * 4
          : 3;
      const activeKey = data.isHovered
        ? `hover-${data.burstUntil}`
        : `burst-${data.burstUntil}`;
      if (!data.activePackage || data.activePackage.key !== activeKey) {
        data.activePackage = createEffectPackage({
          drawHeight,
          glyphWidth,
          strength: disassembleStrength,
          direction: data.burstVector,
          lineCount: 0,
          lineSpread: 0,
          shiftBase: 4 + maxOffset * 0.28,
          alphaBase: data.isHovered ? 0.05 : 0.07,
          key: activeKey,
        });
      }
      const activePackage = data.activePackage;

      for (let y = 0; y < drawHeight; y += sliceHeight) {
        const bandIndex = Math.floor(y / sliceHeight);
        const bandPackage = activePackage?.bands[bandIndex] || null;
        const bandHeight = Math.min(sliceHeight, drawHeight - y);
        const bandProgress = drawHeight <= sliceHeight ? 0 : y / (drawHeight - sliceHeight);
        const randomBias =
          (Math.random() * 2 - 1) *
          (0.24 + disassembleStrength * 0.18 + Math.random() * 0.24);
        const waveTempo =
          data.burstTempo *
          (0.85 + Math.random() * 0.7) *
          (data.isHovered ? 1.18 : burstActive ? 1 : 0.82);
        const horizontalBias =
          Math.sin(
            now * waveTempo +
              y * (0.12 + data.burstSliceBoost * 0.42 + Math.random() * 0.08)
          ) *
            (0.12 + data.burstSliceBoost * 0.46 + Math.random() * 0.12) +
          data.burstBias *
            data.burstVector *
            (0.08 + bandProgress * (0.08 + Math.random() * 0.1)) +
          randomBias;
        const scatterX =
          ((Math.random() * 2 - 1) *
            (0.38 + disassembleStrength * 0.52 + Math.random() * 0.28) +
            horizontalBias) *
            maxOffset *
            disassembleStrength +
          (bandPackage?.shiftOffset || 0) * 0.18;
        const scatterY =
          (Math.random() * 2 - 1) *
            verticalScatter *
            (0.18 +
              bandProgress * (0.36 + Math.random() * 0.32) +
              Math.random() * 0.18) *
            disassembleStrength +
          (bandPackage?.yOffset || 0) * 0.5;
        const stretch =
          1 +
          (Math.random() * 0.08 - 0.04) * disassembleStrength +
          ((bandPackage?.stretch || 1) - 1) * 0.45;
        const destWidth = Math.max(1, glyphWidth * stretch);
        const destX = drawX + scatterX - (destWidth - glyphWidth) * 0.5;
        ctx.globalAlpha =
          (data.isHovered ? 0.72 : 0.62) +
          Math.random() * 0.1 +
          (bandPackage?.alphaOffset || 0);
        ctx.drawImage(
          offscreen,
          0,
          Math.round(y * data.dpr),
          Math.round(glyphWidth * data.dpr),
          Math.round(bandHeight * data.dpr),
          destX,
          y + scatterY,
          destWidth,
          bandHeight
        );

        const echoShift =
          ((Math.random() * 2 - 1) * 0.7 +
            Math.sin(cycle + bandIndex * 0.72) * 0.35) *
          maxOffset *
          0.08 *
          disassembleStrength;
        ctx.globalAlpha = data.isHovered ? 0.18 : 0.12;
        ctx.drawImage(
          offscreen,
          0,
          Math.round(y * data.dpr),
          Math.round(glyphWidth * data.dpr),
          Math.round(bandHeight * data.dpr),
          drawX + echoShift + (bandPackage?.shiftOffset || 0) * 0.18,
          y + scatterY * 0.42,
          glyphWidth,
          bandHeight
        );
      }

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const fractureStrength = data.isHovered
        ? 1
        : burstActive
          ? Math.max(0.18, burstStrength)
          : 0;
      const fractureCount = Math.max(
        0,
        Math.round(2 + fractureStrength * 5)
      );
      for (let i = 0; i < fractureCount; i++) {
        const widthSeed = staticNoise(now * 0.003 + i * 17.3);
        const heightSeed = staticNoise(now * 0.002 + i * 11.7);
        const xSeed = staticNoise(now * 0.0016 + i * 9.1);
        const ySeed = staticNoise(now * 0.0019 + i * 13.4);
        const fractureWidth = Math.max(
          1,
          Math.round(glyphWidth * (0.005 + widthSeed * 0.012))
        );
        const fractureHeight = Math.max(
          4,
          Math.round(drawHeight * (0.12 + heightSeed * 0.22))
        );
        const fractureX =
          drawX + Math.round((glyphWidth - fractureWidth) * xSeed);
        const fractureY = Math.round((drawHeight - fractureHeight) * ySeed);
        ctx.fillRect(fractureX, fractureY, fractureWidth, fractureHeight);
      }
      ctx.restore();

      ctx.globalAlpha = data.isHovered ? 0.08 : 0.05;
      ctx.drawImage(
        offscreen,
        0,
        0,
        Math.round(glyphWidth * data.dpr),
        offscreen.height,
        drawX + activePackage.ghostShiftA * (1 + Math.sin(cycle) * 0.18),
        0,
        glyphWidth,
        drawHeight
      );
      ctx.globalAlpha = data.isHovered ? 0.05 : 0.03;
      ctx.drawImage(
        offscreen,
        0,
        0,
        Math.round(glyphWidth * data.dpr),
        offscreen.height,
        drawX + activePackage.ghostShiftB * (1 + Math.cos(cycle * 1.18) * 0.16),
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
        data.isHovered = active;
        data.targetIntensity = active ? HOVER_INTENSITY : BASE_INTENSITY;
        if (active) {
          data.burstUntil = performance.now() + 300;
          data.burstIntensity = 0.14;
        }
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
  }

  if (!window.__siteModules) window.__siteModules = {};
  window.__siteModules.initHeroTextFloatModule = initHeroTextFloat;
})();
