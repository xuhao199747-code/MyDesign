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
    const criticalResources = siteUtils.getArrayOption(preloaderConfig, "criticalResources", [
      "./imag/frame_front.webp",
      "./imag/sprite.webp",
      "./imag/sprite_2.webp",
      "./imag/sprite_3.webp",
      "./imag/sprite_4.webp",
    ]);

    // 非关键资源：后台并行加载，不阻塞首屏显示
    const nonCriticalResources = siteUtils.getArrayOption(preloaderConfig, "nonCriticalResources", [
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
    ]);

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
      if (!criticalReady || !heroReady || !minimumDisplayElapsed) return;
      hidePreloader();
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
      }, siteUtils.getNumberOption(preloaderConfig, "minimumDisplayMs", 900));

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

      // 等待关键资源加载完成后立即显示首屏
      await Promise.all(
        criticalResources.map((url) => loadResource(url).catch(() => {}))
      );

      // 关键资源就绪，隐藏预加载遮罩
      hidePreloader();

      // 非关键资源继续在后台加载
      await Promise.all(loadPromises);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startLoading, { once: true });
    } else {
      startLoading();
    }

    // 安全兜底：最多 7 秒后强制隐藏
    setTimeout(() => {
      criticalReady = true;
      heroReady = true;
      minimumDisplayElapsed = true;
      hidePreloader();
    }, siteUtils.getNumberOption(preloaderConfig, "maxDisplayMs", 7000));
  }

  registerSiteModule("initPreloaderModule", initPreloader);
})();
