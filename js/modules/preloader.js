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

    const mobileBreakpoint = siteUtils.getNumberOption(preloaderConfig, "mobileBreakpoint", 768);
    const isMobileViewport = window.matchMedia?.(`(max-width: ${mobileBreakpoint - 1}px)`).matches;
    const prefersReducedData = Boolean(navigator.connection?.saveData);
    const useMobileResourceList = isMobileViewport || prefersReducedData;
    document.documentElement.classList.add("preloader-active");
    document.body.classList.add("preloader-active");
    const heroTracker = queryElement("[data-head-tracker]");
    const heroCanvas = queryElement("[data-section-node='head-tracker-canvas']");
    let heroReady =
      useMobileResourceList ||
      !heroTracker ||
      !heroCanvas ||
      heroTracker.classList.contains("is-ready");
    let staticReady = false;
    const preloadStatus = (window.__sitePreloadStatus = window.__sitePreloadStatus || {
      phase: "loading",
      startedAt: performance.now(),
      staticReady: false,
      heroReady,
      complete: false,
    });
    const setPreloadPhase = (phase, extra = {}) => {
      Object.assign(preloadStatus, extra, { phase, updatedAt: performance.now() });
      window.dispatchEvent(new CustomEvent("site:preload-phase", { detail: { phase, ...extra } }));
    };

    // 关键资源：首屏必须加载完才显示
    const criticalResources = siteUtils.getArrayOption(
      preloaderConfig,
      useMobileResourceList ? "mobileCriticalResources" : "criticalResources",
      []
    );

    // 非关键资源：后台并行加载，不阻塞首屏显示
    const nonCriticalResources = siteUtils.getArrayOption(
      preloaderConfig,
      useMobileResourceList ? "mobileNonCriticalResources" : "nonCriticalResources",
      []
    );

    const waitForAllResources =
      preloaderConfig.waitForAllResources !== false && !useMobileResourceList;
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
    let mobileProgressPulseFrame = 0;
    const preloadStartedAt = performance.now();

    // 首屏模块可能比预加载器晚初始化，也可能已经在监听器注册前完成首帧。
    // 每次检查时同步 DOM 状态，避免错过 hero:first-frame-ready 后只能等兜底计时器。
    const syncHeroReady = () => {
      if (heroReady) return true;
      if (!heroTracker || !heroCanvas || heroTracker.classList.contains("is-ready")) {
        heroReady = true;
        setPreloadPhase("hero-ready", { heroReady: true });
      }
      return heroReady;
    };

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
      syncHeroReady();
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
      const canComplete =
        resourcesReady &&
        staticReady &&
        minimumDisplayElapsed &&
        (bootReady || bootGraceElapsed);
      const percentage = canComplete
        ? 100
        : Math.min(98, rawPercentage);
      updateProgressTarget(percentage);
    };

    // 移动端首屏图片通过 Image 解码，加载过程中没有可读取的字节进度。
    // 用平滑的等待进度避免百分比停在 0，真实资源完成后仍由 updateProgress 决定完成状态。
    const pulseMobileProgress = () => {
      if (hasHidden || !useMobileResourceList) return;
      if (!resourcesReady) {
        const elapsed = performance.now() - preloadStartedAt;
        const waitingProgress = Math.min(90, 8 + elapsed / 120);
        updateProgressTarget(waitingProgress);
      }
      mobileProgressPulseFrame = requestAnimationFrame(pulseMobileProgress);
    };

    const hidePreloader = () => {
      if (!preloader || hasHidden) return;
      updateProgressTarget(100);
      displayedProgress = 100;
      targetProgress = 100;
      renderProgress(100);
      hasHidden = true;
      preloadStatus.complete = true;
      setPreloadPhase("complete", { staticReady: true, complete: true });
      preloader.classList.add("preloader--hidden");
      if (mobileProgressPulseFrame) {
        cancelAnimationFrame(mobileProgressPulseFrame);
        mobileProgressPulseFrame = 0;
      }
      document.documentElement.classList.remove("preloader-active");
      document.body.classList.remove("preloader-active");
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
      if (
        !resourcesReady ||
        !staticReady ||
        !minimumDisplayElapsed ||
        (!bootReady && !bootGraceElapsed)
      ) {
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

    const loadImageResource = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        try {
          img.fetchPriority = "high";
        } catch {}
        img.onload = async () => {
          try {
            if (typeof img.decode === "function") {
              await img.decode().catch(() => {});
            }
          } finally {
            preloadedImages.set(url, img);
            const progress = resourceProgress.get(url);
            if (progress) {
              progress.loaded = progress.total || 1;
              progress.total = progress.total || 1;
              progress.done = true;
            }
            updateProgress();
            resolve();
          }
        };
        img.onerror = () => {
          reject(new Error(`Failed to preload image ${url}`));
        };
        img.src = url;
      });

    const loadResource = (url) => {
      return new Promise(async (resolve) => {
        if (preloadedImages.has(url)) {
          resolve({ url, status: "cached" });
          return;
        }

        resourceProgress.set(url, { loaded: 0, total: 0, done: false });

        try {
          if (url.endsWith(".ttf") || url.endsWith(".otf")) {
            const blob = await readResourceBytes(url);
            const font = new FontFace("PreloadFont", await blob.arrayBuffer());
            const loadedFont = await font.load();
            document.fonts?.add?.(loadedFont);
          } else if (url.match(/\.(png|jpe?g|webp|gif|svg)$/i)) {
            await loadImageResource(url);
          } else {
            await readResourceBytes(url);
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
      if (useMobileResourceList) {
        mobileProgressPulseFrame = requestAnimationFrame(pulseMobileProgress);
      }
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

      window.addEventListener(
        "hero:first-frame-ready",
        () => {
          heroReady = true;
          setPreloadPhase("hero-ready", { heroReady: true });
          tryHidePreloader();
        },
        { once: true }
      );

      // 兼容模块启动顺序变化：如果事件已错过，短轮询读取首屏真实状态。
      const pollHeroReady = () => {
        if (hasHidden || syncHeroReady()) {
          tryHidePreloader();
          return;
        }
        window.setTimeout(pollHeroReady, 50);
      };
      pollHeroReady();

      setTimeout(() => {
        bootGraceElapsed = true;
        tryHidePreloader();
      }, siteUtils.getNumberOption(preloaderConfig, "bootGraceMs", 450));

      // 首屏海报已经由 HTML 的 <img fetchpriority="high"> 开始加载。
      // 不要再创建第二个 Image 重复下载/解码，否则海报已经可见时预加载层仍会等待。
      const poster = queryElement("[data-section-node='head-tracker-poster']");
      if (poster?.complete && poster.naturalWidth > 0) {
        const posterUrl = new URL(poster.currentSrc || poster.src, document.baseURI).href;
        blockingResources.forEach((url) => {
          const resourceUrl = new URL(url, document.baseURI).href;
          if (resourceUrl === posterUrl) preloadedImages.set(url, poster);
        });
      }

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
        staticReady = true;
        setPreloadPhase("static-ready", { staticReady: true });
        updateProgress();
        tryHidePreloader();
        return;
      }

      // 优化模式：只等待首屏关键资源；其他素材在页面可进入后空闲加载。
      await Promise.all(loadBlockingResources);
      resourcesReady = true;
      staticReady = true;
      setPreloadPhase("static-ready", { staticReady: true });
      updateProgress();
      tryHidePreloader();

      if (!backgroundResources.length) return;

      const loadBackgroundResources = () => {
        // 图片由 near-viewport loader 按滚动距离接管；这里仅预热字体等轻量资源，
        // 避免首屏后立刻把整站图片塞进网络队列，反而拖慢精灵图和用户正在看的内容。
        const warmResources = backgroundResources.filter(
          (url) => !url.match(/\.(png|jpe?g|webp|gif|svg)$/i)
        );
        Promise.all(warmResources.map((url) => loadResource(url))).then(() => {
          if (failedResources.length) {
            console.warn("[preloader] some resources failed to load", failedResources);
          }
        });
      };

      // 不依赖 requestIdleCallback：首屏动画持续运行时，空闲回调可能长期得不到执行，
      // 结果就是后续图片一直保持 lazy 未加载状态。
      window.setTimeout(loadBackgroundResources, 240);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startLoading, { once: true });
    } else {
      startLoading();
    }

    // 可选安全兜底。配置为 0 时不跳过资源等待，确保“全部素材加载完才能进入”。
    const maxDisplayMs = siteUtils.getNumberOption(preloaderConfig, "maxDisplayMs", 15000);
    if (maxDisplayMs > 0) {
      setTimeout(() => {
        resourcesReady = true;
        bootReady = true;
        minimumDisplayElapsed = true;
        staticReady = true;
        hidePreloader();
      }, maxDisplayMs);
    }
  }

  registerSiteModule("initPreloaderModule", initPreloader);
})();
