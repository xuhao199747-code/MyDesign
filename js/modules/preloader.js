(function registerPreloaderModule() {
  const siteRuntime = window.__siteRuntime || {};
  const siteSections = window.__siteSections || {};
  const getElementById =
    siteRuntime.getElementById || ((elementId) => document.getElementById(elementId));
  const queryElement =
    siteRuntime.queryElement || ((selector, root = document) => root.querySelector(selector));
  const registerSiteModule =
    siteRuntime.registerSiteModule ||
    ((moduleName, initModule) => {
      if (!window.__siteModules) window.__siteModules = {};
      window.__siteModules[moduleName] = initModule;
    });

  function initPreloader(options = {}) {
    const {
      preloaderConfig = {},
      siteUtils = {
        getArrayOption(_object, _key, fallback) {
          return fallback;
        },
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
      },
    } = options;
    const systemElements = siteSections.getSystemElements?.() || {};
    const preloader = systemElements.preloader || getElementById("preloader");
    const progressBar =
      systemElements.preloaderBar || queryElement(".preloader__bar", preloader || document);
    const progressText =
      systemElements.preloaderText || queryElement(".preloader__text", preloader || document);
    const typeText =
      systemElements.preloaderTypeText ||
      queryElement(".preloader__type-text", preloader || document);

    if (!preloader) return;
    if (preloader.dataset.preloaderReady === "true") return;
    preloader.dataset.preloaderReady = "true";

    // 关键资源：首屏必须加载完才显示
    const criticalResources = siteUtils.getArrayOption(
      preloaderConfig,
      "criticalResources",
      []
    );

    // 非关键资源：后台并行加载，不阻塞首屏显示
    const nonCriticalResources = siteUtils.getArrayOption(
      preloaderConfig,
      "nonCriticalResources",
      []
    );

    const waitForAllResources = preloaderConfig.waitForAllResources !== false;
    const allResources = [...new Set([...criticalResources, ...nonCriticalResources])];
    const criticalResourceSet = new Set(criticalResources);
    const blockingResources = waitForAllResources ? allResources : [...new Set(criticalResources)];
    const backgroundResources = waitForAllResources
      ? []
      : allResources.filter((url) => !criticalResourceSet.has(url));
    let loadedCount = 0;
    const totalCount = blockingResources.length;
    let hasHidden = false;
    let resourcesReady = false;
    let bootReady = Boolean(window.__siteBootStatus?.completedAt);
    let bootGraceElapsed = bootReady;
    let minimumDisplayElapsed =
      siteUtils.getNumberOption(preloaderConfig, "minimumDisplayMs", 0) <= 0;
    const failedResources = [];
    const resourceProgress = new Map();
    let targetProgress = 0;
    let displayedProgress = 0;
    let progressFrame = 0;

    const renderProgress = (percentage) => {
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }
      if (progressText) {
        progressText.textContent = `LOADING ${percentage}%`;
      }
    };

    const animateProgress = () => {
      displayedProgress = targetProgress;
      renderProgress(Math.round(displayedProgress));
      progressFrame = 0;
    };

    const updateProgressTarget = (nextProgress) => {
      if (hasHidden) return;
      targetProgress = Math.max(targetProgress, Math.min(100, nextProgress));
      if (progressFrame) cancelAnimationFrame(progressFrame);
      progressFrame = requestAnimationFrame(animateProgress);
    };

    const updateProgress = () => {
      bootReady = bootReady || Boolean(window.__siteBootStatus?.completedAt);
      const progressItems = Array.from(resourceProgress.values());
      const knownTotalBytes = progressItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const knownLoadedBytes = progressItems.reduce((sum, item) => {
        if (!item.total) return sum;
        return sum + Math.min(item.loaded, item.total);
      }, 0);
      const unknownItems = progressItems.filter((item) => !item.total);
      const unknownDone = unknownItems.filter((item) => item.done).length;
      const unknownWeight = unknownItems.length;
      const rawPercentage = knownTotalBytes > 0
        ? ((knownLoadedBytes + unknownDone) / (knownTotalBytes + unknownWeight)) * 100
        : totalCount
          ? (loadedCount / totalCount) * 100
          : 100;
      const canComplete = resourcesReady && minimumDisplayElapsed && (bootReady || bootGraceElapsed);
      const percentage = canComplete
        ? 100
        : Math.min(98, rawPercentage);
      updateProgressTarget(percentage);
    };

    const hidePreloader = () => {
      if (!preloader || hasHidden) return;
      updateProgressTarget(100);
      displayedProgress = 100;
      targetProgress = 100;
      renderProgress(100);
      hasHidden = true;
      preloader.classList.add("preloader--hidden");
      setTimeout(() => {
        preloader.remove();
      }, siteUtils.getNumberOption(preloaderConfig, "hideDelayMs", 600));
    };

    if (typeText) {
      const phrases = siteUtils.getArrayOption(preloaderConfig, "phrases", [
        "Please wait a moment.",
        "Loading the full experience.",
      ]);
      let phraseIndex = 0;
      let charIndex = 0;
      let deleting = false;
      const typePauseMs = siteUtils.getNumberOption(preloaderConfig, "typePauseMs", 900);
      const typeNextPhraseDelayMs = siteUtils.getNumberOption(preloaderConfig, "typeNextPhraseDelayMs", 220);
      const typeForwardMs = siteUtils.getNumberOption(preloaderConfig, "typeForwardMs", 42);
      const typeBackwardMs = siteUtils.getNumberOption(preloaderConfig, "typeBackwardMs", 24);

      const tickType = () => {
        if (!document.body.contains(typeText)) return;
        const current = phrases[phraseIndex];
        if (!deleting) {
          charIndex = Math.min(current.length, charIndex + 1);
          typeText.textContent = current.slice(0, charIndex);
          if (charIndex === current.length) {
            deleting = true;
            setTimeout(tickType, typePauseMs);
            return;
          }
          setTimeout(tickType, typeForwardMs);
          return;
        }

        charIndex = Math.max(0, charIndex - 1);
        typeText.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(tickType, typeNextPhraseDelayMs);
          return;
        }
        setTimeout(tickType, typeBackwardMs);
      };

      typeText.textContent = "";
      tickType();
    }

    const tryHidePreloader = () => {
      bootReady = bootReady || Boolean(window.__siteBootStatus?.completedAt);
      if (!resourcesReady || !minimumDisplayElapsed || (!bootReady && !bootGraceElapsed)) {
        updateProgress();
        return;
      }
      updateProgressTarget(100);
      hidePreloader();
    };

    // 预加载缓存：将已加载的 Image 对象暴露给其他模块复用
    const preloadedImages = new Map();

    const readResourceBytes = async (url) => {
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`Failed to preload ${url}: ${response.status}`);
      }

      const total = Number(response.headers.get("content-length")) || 0;
      const progress = resourceProgress.get(url) || { loaded: 0, total, done: false };
      progress.total = total;
      resourceProgress.set(url, progress);
      updateProgress();

      if (!response.body || !response.body.getReader) {
        const blob = await response.blob();
        progress.loaded = total || blob.size || 1;
        progress.total = total || blob.size || 1;
        progress.done = true;
        updateProgress();
        return blob;
      }

      const reader = response.body.getReader();
      const chunks = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
        progress.loaded = loaded;
        updateProgress();
      }

      progress.loaded = total || loaded || 1;
      progress.total = total || loaded || 1;
      progress.done = true;
      updateProgress();
      return new Blob(chunks);
    };

    const decodeImageBlob = (url, blob) =>
      new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          preloadedImages.set(url, img);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Failed to decode image ${url}`));
        };
        img.src = objectUrl;
      });

    const loadResource = (url) => {
      return new Promise(async (resolve) => {
        if (preloadedImages.has(url)) {
          resolve({ url, status: "cached" });
          return;
        }

        resourceProgress.set(url, { loaded: 0, total: 0, done: false });

        try {
          const blob = await readResourceBytes(url);
          if (url.endsWith(".ttf") || url.endsWith(".otf")) {
            const font = new FontFace("PreloadFont", await blob.arrayBuffer());
            const loadedFont = await font.load();
            document.fonts?.add?.(loadedFont);
          } else if (url.match(/\.(png|jpe?g|webp|gif|svg)$/i)) {
            await decodeImageBlob(url, blob);
          }
          resolve({ url, status: "loaded" });
        } catch (_error) {
          const progress = resourceProgress.get(url);
          if (progress) {
            progress.loaded = progress.total || 1;
            progress.total = progress.total || 1;
            progress.done = true;
          }
          failedResources.push(url);
          updateProgress();
          resolve({ url, status: "failed" });
        }
      });
    };

    // 暴露预加载缓存，供 head tracker 等模块复用
    window.__preloadedImages = preloadedImages;

    const startLoading = async () => {
      if (!minimumDisplayElapsed) {
        setTimeout(() => {
          minimumDisplayElapsed = true;
          tryHidePreloader();
        }, siteUtils.getNumberOption(preloaderConfig, "minimumDisplayMs", 0));
      }

      window.addEventListener(
        "site:boot-complete",
        () => {
          bootReady = true;
          bootGraceElapsed = true;
          tryHidePreloader();
        },
        { once: true }
      );

      setTimeout(() => {
        bootGraceElapsed = true;
        tryHidePreloader();
      }, siteUtils.getNumberOption(preloaderConfig, "bootGraceMs", 450));

      const loadBlockingResources = blockingResources.map((url) =>
        loadResource(url).then(() => {
          loadedCount++;
          updateProgress();
        })
      );

      if (waitForAllResources) {
        await Promise.all(loadBlockingResources);
        loadedCount = totalCount;
        if (failedResources.length) {
          console.warn("[preloader] some resources failed to load", failedResources);
        }
        resourcesReady = true;
        updateProgress();
        tryHidePreloader();
        return;
      }

      // 优化模式：只等待首屏关键资源；其他素材在页面可进入后空闲加载。
      await Promise.all(loadBlockingResources);
      resourcesReady = true;
      updateProgress();
      tryHidePreloader();

      if (!backgroundResources.length) return;

      const loadBackgroundResources = () => {
        Promise.all(backgroundResources.map((url) => loadResource(url))).then(() => {
          if (failedResources.length) {
            console.warn("[preloader] some resources failed to load", failedResources);
          }
        });
      };

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadBackgroundResources, { timeout: 2200 });
        return;
      }
      window.setTimeout(loadBackgroundResources, 450);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startLoading, { once: true });
    } else {
      startLoading();
    }

    // 安全兜底：资源异常时最多等待 15 秒，避免页面永久卡在加载层。
    setTimeout(() => {
      resourcesReady = true;
      bootReady = true;
      minimumDisplayElapsed = true;
      hidePreloader();
    }, siteUtils.getNumberOption(preloaderConfig, "maxDisplayMs", 15000));
  }

  registerSiteModule("initPreloaderModule", initPreloader);
})();
