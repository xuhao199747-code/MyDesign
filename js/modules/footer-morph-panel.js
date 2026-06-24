(function registerFooterMorphPanelModule() {
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
  const lerp = (start, end, progress) => start + (end - start) * progress;

  function buildWavePath(width, height, progress, config) {
    const closedY = config.closedY * height;
    const openY = config.openY * height;
    const crest = lerp(closedY, openY, progress);
    const amplitude = lerp(config.closedAmplitude * height, config.openAmplitude * height, progress);

    const points = config.points.map((point) => ({
      x: point.x * width,
      y: crest + point.offset * amplitude,
    }));

    let path = `M 0 ${height} L 0 ${points[0].y}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const cp1x = current.x + (next.x - current.x) * 0.32;
      const cp1y = current.y;
      const cp2x = current.x + (next.x - current.x) * 0.68;
      const cp2y = next.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    path += ` L ${width} ${height} Z`;
    return path;
  }

  function initFooterMorphPanelModule() {
    const footer = querySection("footer");
    const stage = querySectionNode("footer-stage", footer || document);
    const panel = querySectionNode("footer-panel", footer || document);
    const overlay = querySectionNode("footer-morph-overlay", footer || document);
    const svg = overlay?.querySelector(".footer-demo__morph-svg");
    const topPath = overlay?.querySelector('[data-footer-morph-layer="top"]');
    const midPath = overlay?.querySelector('[data-footer-morph-layer="mid"]');
    const basePath = overlay?.querySelector('[data-footer-morph-layer="base"]');
    if (!footer || !stage || !panel || !overlay || !svg || !topPath || !midPath || !basePath) return;
    if (panel.dataset.footerMorphReady === "true") return;
    panel.dataset.footerMorphReady = "true";

    const gsapApi = window.gsap;
    const state = { progress: 0 };
    const waveConfigs = {
      top: {
        closedY: 0.992,
        openY: -0.1,
        closedAmplitude: 0.028,
        openAmplitude: 0.46,
        points: [
          { x: 0, offset: -1.55 },
          { x: 0.1, offset: 1.35 },
          { x: 0.24, offset: 0.15 },
          { x: 0.34, offset: -1.7 },
          { x: 0.46, offset: 1.85 },
          { x: 0.58, offset: -0.65 },
          { x: 0.69, offset: 0.52 },
          { x: 0.79, offset: -0.72 },
          { x: 0.9, offset: 0.35 },
          { x: 1, offset: 1.95 },
        ],
      },
      mid: {
        closedY: 1.028,
        openY: -0.06,
        closedAmplitude: 0.014,
        openAmplitude: 0.4,
        points: [
          { x: 0, offset: -1.05 },
          { x: 0.12, offset: 0.62 },
          { x: 0.28, offset: -1.18 },
          { x: 0.42, offset: 0.95 },
          { x: 0.58, offset: -0.35 },
          { x: 0.74, offset: 0.3 },
          { x: 0.9, offset: -0.18 },
          { x: 1, offset: 0.24 },
        ],
      },
      base: {
        closedY: 1.11,
        openY: -0.08,
        closedAmplitude: 0.006,
        openAmplitude: 0.2,
        points: [
          { x: 0, offset: -1.2 },
          { x: 0.12, offset: 0.72 },
          { x: 0.26, offset: 0.08 },
          { x: 0.41, offset: -1.02 },
          { x: 0.55, offset: -0.15 },
          { x: 0.72, offset: 0.08 },
          { x: 0.86, offset: -0.28 },
          { x: 1, offset: 0.22 },
        ],
      },
    };

    let rafId = 0;

    const render = () => {
      rafId = 0;
      const rect = panel.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      const baseProgress = clamp((state.progress - 0.42) / 0.58, 0, 1);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      panel.style.setProperty("--footer-morph-progress", state.progress.toFixed(4));
      topPath.setAttribute("d", buildWavePath(width, height, state.progress, waveConfigs.top));
      midPath.setAttribute("d", buildWavePath(width, height, state.progress, waveConfigs.mid));
      basePath.setAttribute("d", buildWavePath(width, height, baseProgress, waveConfigs.base));
      topPath.style.opacity = "1";
      midPath.style.opacity = "1";
      basePath.style.opacity = "1";
    };

    const requestRender = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(render);
    };

    const updateTargetProgress = () => {
      const stageRect = stage.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const scrollRange = Math.max(stage.offsetHeight - viewportHeight, 1);
      const earlyStart = viewportHeight * 1.55;
      const entryDistance = viewportHeight + earlyStart;
      const stickyDistance = scrollRange;
      const totalDistance = entryDistance + stickyDistance;
      const triggerLine = viewportHeight + earlyStart;
      const traveled = clamp(triggerLine - stageRect.top, 0, totalDistance);
      const target = clamp(traveled / totalDistance, 0, 1);

      if (gsapApi) {
        gsapApi.to(state, {
          progress: target,
          duration: 0.42,
          ease: "power2.out",
          overwrite: true,
          onUpdate: requestRender,
        });
      } else {
        state.progress = target;
        requestRender();
      }
    };

    window.addEventListener("scroll", updateTargetProgress, { passive: true });
    window.addEventListener("resize", updateTargetProgress);
    window.addEventListener("load", updateTargetProgress, { once: true });
    window.addEventListener("pageshow", updateTargetProgress, { once: true });

    requestRender();
    updateTargetProgress();
    window.setTimeout(updateTargetProgress, 120);
    window.setTimeout(updateTargetProgress, 360);
  }

  registerSiteModule("initFooterMorphPanelModule", initFooterMorphPanelModule);
})();
