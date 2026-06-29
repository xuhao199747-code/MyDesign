(function registerFeaturedMorphPanelModule() {
  const siteRuntime = window.__siteRuntime || {};
  const querySection =
    siteRuntime.querySection ||
    ((sectionName, root = document) =>
      root.querySelector(`[data-site-section="${sectionName}"]`));
  const querySectionNode =
    siteRuntime.querySectionNode ||
    ((nodeName, root = document) =>
      root.querySelector(`[data-section-node="${nodeName}"]`));
  const registerSiteModule =
    siteRuntime.registerSiteModule ||
    ((moduleName, initModule) => {
      if (!window.__siteModules) window.__siteModules = {};
      window.__siteModules[moduleName] = initModule;
    });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const easeOutQuart = (t) => 1 - (1 - t) ** 4;
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  function getCurve(points, numPoints) {
    let path = "";
    for (let index = 0; index < numPoints - 1; index += 1) {
      const point = ((index + 1) / (numPoints - 1)) * 100;
      const controlPoint = point - ((1 / (numPoints - 1)) * 100) / 2;
      path += ` ${controlPoint} ${points[index]} ${controlPoint} ${points[index + 1]} ${point} ${points[index + 1]}`;
    }
    return path;
  }

  function initFeaturedMorphPanelModule() {
    const section = querySection("featured") || document.getElementById("portfolio-featured");
    const pin = querySectionNode("featured-pin", section || document);
    const overlay = querySectionNode("featured-morph-overlay", section || document);
    const firstContent = querySectionNode("featured-first-screen", section || document);
    const secondContent = querySectionNode("featured-second-screen", section || document);
    const paths = overlay?.querySelectorAll(".mydesign-morph__svg path");

    if (!section || !pin || !overlay || !paths?.length || !firstContent || !secondContent) return;
    if (pin.dataset.featuredMorphReady === "true") return;
    pin.dataset.featuredMorphReady = "true";

    const numPoints = 12;
    const numPaths = paths.length;
    const allPoints = Array.from({ length: numPaths }, () =>
      Array.from({ length: numPoints }, () => 100)
    );
    let mode = "hidden";
    let lastRaw = 0;
    let rafId = 0;

    const renderMorph = () => {
      for (let index = 0; index < numPaths; index += 1) {
        const points = allPoints[index];
        let d = "";

        if (mode === "enterFromBottom" || mode === "wipeDown") {
          d = `M 0 ${points[0]} C${getCurve(points, numPoints)} V 100 H 0 Z`;
        } else if (mode === "visible") {
          d = "M 0 0 H 100 V 100 H 0 Z";
        }

        paths[index].setAttribute("d", d);
      }
    };

    const updateEnterByProgress = (progress) => {
      const p = easeInOutSine(clamp(progress, 0, 1));

      if (p <= 0.001) {
        mode = "hidden";
        renderMorph();
        return;
      }

      if (p >= 0.995) {
        mode = "visible";
        renderMorph();
        return;
      }

      mode = "enterFromBottom";
      const waveStrength = Math.sin(p * Math.PI) * 26;

      for (let pathIndex = 0; pathIndex < numPaths; pathIndex += 1) {
        const layerDelay = pathIndex * 0.24;
        const layerOffset = pathIndex * 9.5;

        for (let pointIndex = 0; pointIndex < numPoints; pointIndex += 1) {
          const pointDelay = (pointIndex / (numPoints - 1)) * 0.32 + layerDelay;
          const available = 1 - pointDelay;
          const localP = easeOutQuart(clamp((p - pointDelay) / available, 0, 1));
          const baseY = 100 - localP * 100;
          const wave =
            Math.sin(pointIndex * 1.22 + p * Math.PI * 2.2 + layerOffset) *
            waveStrength *
            (0.65 + (1 - localP) * 0.35);

          allPoints[pathIndex][pointIndex] = clamp(baseY + wave, 0, 100);
        }
      }

      renderMorph();
    };

    const updateReturnWipeByProgress = (progress) => {
      const p = easeInOutSine(clamp(progress, 0, 1));

      if (p <= 0.001) {
        mode = "visible";
        for (let pathIndex = 0; pathIndex < numPaths; pathIndex += 1) {
          for (let pointIndex = 0; pointIndex < numPoints; pointIndex += 1) {
            allPoints[pathIndex][pointIndex] = 0;
          }
        }
        renderMorph();
        return;
      }

      if (p >= 0.995) {
        mode = "hidden";
        renderMorph();
        return;
      }

      mode = "wipeDown";
      const waveStrength = Math.sin(p * Math.PI) * 24;

      for (let pathIndex = 0; pathIndex < numPaths; pathIndex += 1) {
        const layerDelay = pathIndex * 0.22;
        const layerOffset = pathIndex * 8.5;

        for (let pointIndex = 0; pointIndex < numPoints; pointIndex += 1) {
          const pointDelay = (pointIndex / (numPoints - 1)) * 0.28 + layerDelay;
          const available = 1 - pointDelay;
          const localP = easeOutQuart(clamp((p - pointDelay) / available, 0, 1));
          const baseY = localP * 100;
          const wave =
            Math.sin(pointIndex * 1.18 + p * Math.PI * 2 + layerOffset) *
            waveStrength *
            (0.72 + (1 - localP) * 0.28);

          allPoints[pathIndex][pointIndex] = clamp(baseY + wave, 0, 100);
        }
      }

      renderMorph();
    };

    const updateContentByProgress = (progress) => {
      const isMobileViewport = window.innerWidth <= 768;
      const firstOutStart = isMobileViewport ? 0.06 : 0.18;
      const firstOutDuration = isMobileViewport ? 0.16 : 0.28;
      const secondInStart = isMobileViewport ? 0.22 : 0.68;
      const secondInDuration = isMobileViewport ? 0.18 : 0.24;
      const firstOut = clamp((progress - firstOutStart) / firstOutDuration, 0, 1);
      const secondIn = clamp((progress - secondInStart) / secondInDuration, 0, 1);

      firstContent.style.opacity = `${1 - firstOut}`;
      firstContent.style.transform = `translate3d(0, ${firstOut * -48}px, 0)`;
      firstContent.style.pointerEvents = firstOut > 0.98 ? "none" : "auto";

      secondContent.style.opacity = `${secondIn}`;
      secondContent.style.transform = `translate3d(0, ${48 - secondIn * 48}px, 0)`;
      secondContent.style.pointerEvents = secondIn > 0.98 ? "auto" : "none";
      pin.style.setProperty("--featured-morph-progress", secondIn.toFixed(4));
    };

    const requestRender = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        renderMorph();
      });
    };

    const updateTargetProgress = () => {
      const sectionRect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const scrollRange = Math.max(section.offsetHeight - viewportHeight, 1);
      const raw = clamp((-sectionRect.top) / scrollRange, 0, 1);
      const direction = raw >= lastRaw ? 1 : -1;
      const isMobileViewport = window.innerWidth <= 768;
      const morphStart = isMobileViewport ? 0.1 : 0.32;
      const morphEnd = isMobileViewport ? 0.42 : 0.78;
      const morphProgress = clamp((raw - morphStart) / (morphEnd - morphStart), 0, 1);

      if (raw <= morphStart) {
        if (direction < 0) {
          updateReturnWipeByProgress(1);
        } else {
          mode = "hidden";
          renderMorph();
        }
      } else if (raw >= morphEnd) {
        mode = "visible";
        renderMorph();
      } else if (direction >= 0) {
        updateEnterByProgress(morphProgress);
      } else {
        updateReturnWipeByProgress(1 - morphProgress);
      }

      updateContentByProgress(raw);
      lastRaw = raw;
      requestRender();
    };

    window.addEventListener("scroll", updateTargetProgress, { passive: true });
    window.addEventListener("resize", updateTargetProgress);
    window.addEventListener("load", updateTargetProgress, { once: true });
    window.addEventListener("pageshow", updateTargetProgress, { once: true });

    renderMorph();
    updateTargetProgress();
    window.setTimeout(updateTargetProgress, 120);
    window.setTimeout(updateTargetProgress, 360);
  }

  registerSiteModule("initFeaturedMorphPanelModule", initFeaturedMorphPanelModule);

  const bootWhenReady = () => {
    if (document.readyState === "loading") return;
    initFeaturedMorphPanelModule();
  };

  if (document.readyState !== "loading") {
    window.requestAnimationFrame(bootWhenReady);
  } else {
    document.addEventListener("DOMContentLoaded", bootWhenReady, { once: true });
  }

  window.addEventListener("load", bootWhenReady, { once: true });
  window.setTimeout(bootWhenReady, 180);
  window.setTimeout(bootWhenReady, 640);
})();
