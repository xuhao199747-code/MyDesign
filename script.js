/**
 * Homepage bootstrap.
 * Module files under js/modules register init functions onto window.__siteModules.
 * This file is the single orchestration layer that runs them exactly once.
 */

const siteRuntime = window.__siteRuntime || {};
const getSiteGlobal =
  siteRuntime.getSiteGlobal || ((key, fallbackValue = {}) => window[key] || fallbackValue);
const getSiteConfigSection =
  siteRuntime.getSiteConfigSection ||
  ((sectionName, fallbackValue = {}) =>
    (window.__getSiteConfigSection && window.__getSiteConfigSection(sectionName)) ||
    (window.__siteConfig && window.__siteConfig[sectionName]) ||
    fallbackValue);

const siteUtils = getSiteGlobal("__siteUtils");
const siteHelpers = getSiteGlobal("__siteHelpers");
const siteModules = getSiteGlobal("__siteModules");
const bootConfig = getSiteConfigSection("boot");
const buildConfigOptions = (configName, extraOptions = {}) => ({
  ...extraOptions,
  [`${configName}Config`]: getSiteConfigSection(configName),
});
const getPlayfulTitleOptions = () => {
  const playfulTitleConfig = getSiteConfigSection("playfulTitle");
  return {
    selectors: playfulTitleConfig.selectors || [],
    rotatePattern: playfulTitleConfig.rotatePattern || [],
    assets: playfulTitleConfig.assets || {},
  };
};

const moduleOptionFactories = {
  initSiteContentModule: () => ({
    homeContentConfig: getSiteConfigSection("homeContent"),
    homeTemplateConfig: getSiteConfigSection("homeTemplates"),
  }),
  initSiteShellModule: () => ({
    shellConfig: getSiteConfigSection("shell"),
    siteUtils,
  }),
  initPreloaderModule: () => buildConfigOptions("preloader", { siteUtils }),
  initHeroTextFloatModule: () => buildConfigOptions("heroTextFloat", { siteUtils }),
  initPhotoRevealModule: () => buildConfigOptions("photoReveal", { siteUtils, siteHelpers }),
  initWorksSwipePreviewModule: () => buildConfigOptions("worksSwipePreview", { siteUtils }),
  initPortfolioInfiniteCardsModule: () =>
    buildConfigOptions("infiniteCards", { siteUtils, siteHelpers }),
  initMoreWorkCardsModule: () => ({}),
  initPortfolioFeaturedModule: () =>
    buildConfigOptions("portfolioFeatured", { siteUtils, siteHelpers }),
  initHeadTrackerModule: () => buildConfigOptions("headTracker", { siteHelpers, siteUtils }),
  initPlayfulTitleHoverModule: getPlayfulTitleOptions,
  initLogoPhysicsModule: () => buildConfigOptions("logoPhysics", { siteHelpers, siteUtils }),
  initClickSurpriseBurstModule: () => buildConfigOptions("clickSurprise", { siteUtils }),
  initFooterMorphPanelModule: () => ({ siteUtils }),
};

const moduleBootOrder = Object.keys(moduleOptionFactories);
const deferredModuleTargets = {
  initPhotoRevealModule: "#photo",
  initWorksSwipePreviewModule: ".works-swipe-section",
  initPortfolioInfiniteCardsModule: "#portfolio-copy",
  initMoreWorkCardsModule: "#portfolio-copy",
  initPortfolioFeaturedModule: "#portfolio-featured",
  initLogoPhysicsModule: "#about",
};
const initializedModules = new Set();

const bootStatus = {
  startedAt: Date.now(),
  modules: [],
  summary: {
    initialized: 0,
    missing: 0,
    failed: 0,
  },
};

if (bootConfig.exposeStatus !== false) {
  window.__siteBootStatus = bootStatus;
}

const recordBootStatus = (moduleName, status, detail = "") => {
  const record = {
    moduleName,
    status,
    detail,
    timestamp: Date.now(),
  };
  bootStatus.modules.push(record);
  if (status in bootStatus.summary) {
    bootStatus.summary[status] += 1;
  }

  if (bootConfig.emitEvents !== false) {
    window.dispatchEvent(
      new CustomEvent("site:module-boot", {
        detail: record,
      })
    );
  }
};

const initSiteModule = (moduleName) => {
  if (initializedModules.has(moduleName)) return;
  const initModule = siteModules[moduleName];
  const options = moduleOptionFactories[moduleName]?.() || {};
  if (typeof initModule !== "function") {
    recordBootStatus(moduleName, "missing");
    return;
  }

  try {
    initModule(options);
    initializedModules.add(moduleName);
    recordBootStatus(moduleName, "initialized");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordBootStatus(moduleName, "failed", message);
    console.error(`[site-boot] ${moduleName} failed`, error);
    if (bootConfig.continueOnError === false) {
      throw error;
    }
  }
};

const initModuleWhenNear = (moduleName, targetSelector) => {
  const target = document.querySelector(targetSelector);
  if (!target || !("IntersectionObserver" in window)) {
    initSiteModule(moduleName);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      initSiteModule(moduleName);
    },
    {
      root: null,
      rootMargin: "55% 0px 55% 0px",
      threshold: 0,
    }
  );

  observer.observe(target);
  recordBootStatus(moduleName, "deferred", targetSelector);
};

moduleBootOrder.forEach((moduleName) => {
  const targetSelector = deferredModuleTargets[moduleName];
  if (targetSelector) {
    initModuleWhenNear(moduleName, targetSelector);
    return;
  }

  initSiteModule(moduleName);
});

bootStatus.completedAt = Date.now();
bootStatus.durationMs = bootStatus.completedAt - bootStatus.startedAt;

if (bootConfig.emitEvents !== false) {
  window.dispatchEvent(
    new CustomEvent("site:boot-complete", {
      detail: bootStatus,
    })
  );
}

if (bootConfig.logSummary === true) {
  console.info("[site-boot] summary", bootStatus.summary);
}

(() => {
  const triggerSelector =
    '[data-shell-node="wechat-trigger"], [data-shell-node="wechat-footer-trigger"]';
  const getTrigger = () => document.querySelector('[data-shell-node="wechat-trigger"]');
  const getFooterTrigger = () => document.querySelector('[data-shell-node="wechat-footer-trigger"]');
  const trigger = getTrigger();
  const drop = document.getElementById("navWechatDrop");
  if (!trigger || !drop || drop.dataset.wechatDropControllerReady === "true") return;

  drop.dataset.wechatDropControllerReady = "true";
  let isOpen = false;
  let openScrollY = 0;
  let scrollGuardUntil = 0;
  let scrollWatchFrame = null;
  let closeTimer = null;

  const clearSectionNavState = () => {
    window.__clearActiveNavLink?.();
    document.querySelectorAll(".menu a[aria-current]").forEach((link) => {
      link.removeAttribute("aria-current");
    });
  };

  const restoreOpenScroll = () => {
    if (Math.abs(window.scrollY - openScrollY) <= 1) return;
    window.scrollTo({ top: openScrollY, behavior: "auto" });
  };

  const syncTriggerState = (expanded) => {
    getTrigger()?.setAttribute("aria-expanded", expanded);
    getFooterTrigger()?.setAttribute("aria-expanded", expanded);
  };

  const updatePosition = () => {
    const currentTrigger = getTrigger() || trigger;
    const rect = currentTrigger.getBoundingClientRect();
    drop.style.setProperty("--wechat-drop-x", `${rect.left + rect.width / 2}px`);
    drop.style.setProperty("--wechat-drop-y", `${rect.bottom}px`);
  };

  const closeCard = () => {
    isOpen = false;
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (scrollWatchFrame) {
      window.cancelAnimationFrame(scrollWatchFrame);
      scrollWatchFrame = null;
    }
    drop.classList.remove("is-opening");
    drop.classList.add("is-closing");
    drop.classList.remove("is-loading");
    syncTriggerState("false");
    closeTimer = window.setTimeout(() => {
      drop.classList.remove("is-open", "is-closing");
      drop.setAttribute("aria-hidden", "true");
      closeTimer = null;
    }, 360);
  };

  const forceCloseCard = () => {
    isOpen = false;
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (scrollWatchFrame) {
      window.cancelAnimationFrame(scrollWatchFrame);
      scrollWatchFrame = null;
    }
    drop.classList.remove("is-open", "is-opening", "is-closing", "is-loading");
    drop.setAttribute("aria-hidden", "true");
    syncTriggerState("false");
  };

  const watchScrollWhileOpen = () => {
    if (!isOpen) return;
    if (performance.now() < scrollGuardUntil) {
      restoreOpenScroll();
      scrollWatchFrame = window.requestAnimationFrame(watchScrollWhileOpen);
      return;
    }
    if (Math.abs(window.scrollY - openScrollY) > 2) {
      closeCard();
      return;
    }
    scrollWatchFrame = window.requestAnimationFrame(watchScrollWhileOpen);
  };

  const openCard = () => {
    window.__loadNavWechatLanyard?.();
    updatePosition();
    isOpen = true;
    clearSectionNavState();
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    openScrollY = window.scrollY;
    scrollGuardUntil = performance.now() + 520;
    drop.classList.remove("is-closing", "is-opening");
    if (!drop.classList.contains("is-ready")) {
      drop.classList.add("is-loading");
    }
    drop.setAttribute("aria-hidden", "false");
    syncTriggerState("true");
    void drop.offsetWidth;
    drop.classList.add("is-open", "is-opening");
    window.dispatchEvent(new CustomEvent("nav-wechat-card-open"));
    window.setTimeout(() => drop.classList.remove("is-opening"), 760);
    if (!scrollWatchFrame) {
      scrollWatchFrame = window.requestAnimationFrame(watchScrollWhileOpen);
    }
  };

  const toggleCard = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (isOpen) closeCard();
    else openCard();

    return false;
  };

  const isPointerInsideTrigger = (event) => {
    if (!event || typeof event.clientX !== "number" || typeof event.clientY !== "number") {
      return false;
    }

    const currentTrigger = getTrigger() || trigger;
    const rect = currentTrigger.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  };

  getTrigger()?.setAttribute("aria-haspopup", "dialog");
  getFooterTrigger()?.setAttribute("aria-haspopup", "dialog");
  syncTriggerState("false");
  window.__toggleNavWechatCard = toggleCard;
  window.__closeNavWechatCard = closeCard;
  window.__forceCloseNavWechatCard = forceCloseCard;

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('[data-shell-node="contact-trigger"]')) return;
    const clickedTrigger = event.target.closest(triggerSelector);
    if (!clickedTrigger) return;
    event.stopImmediatePropagation?.();
    toggleCard(event);
  }, true);

  document.addEventListener(
    "click",
    (event) => {
      if (!isOpen) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const navLink = target.closest(".navbar a");
      const currentTrigger = getTrigger() || trigger;
      if (!navLink || navLink === currentTrigger || navLink.contains(currentTrigger)) return;
      closeCard();
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!isOpen || !isPointerInsideTrigger(event)) return;
      event.preventDefault();
      event.stopPropagation();
      closeCard();
    },
    true
  );

  window.addEventListener("scroll", () => {
    if (!isOpen) return;
    if (performance.now() < scrollGuardUntil) {
      restoreOpenScroll();
      return;
    }
    closeCard();
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (isOpen) updatePosition();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) closeCard();
  });

  document.addEventListener("click", (event) => {
    const currentTrigger = getTrigger() || trigger;
    const footerTrigger = getFooterTrigger();
    if (
      !isOpen ||
      currentTrigger.contains(event.target) ||
      footerTrigger?.contains(event.target)
    ) {
      return;
    }
    closeCard();
  });
})();

(() => {
  const hero = document.querySelector('[data-section-node="featured-jack-hero"]');
  const avatar = hero?.querySelector("[data-avatar-parallax]");
  if (!hero || !avatar || hero.dataset.avatarParallaxReady === "true") return;

  hero.dataset.avatarParallaxReady = "true";
  let frame = null;
  let targetX = 0;
  let targetY = 0;
  let targetRotate = 0;
  let isHeroVisible = true;

  const applyAvatarMotion = () => {
    frame = null;
    hero.style.setProperty("--avatar-x", `${targetX.toFixed(2)}px`);
    hero.style.setProperty("--avatar-y", `${targetY.toFixed(2)}px`);
    hero.style.setProperty("--avatar-rotate", `${targetRotate.toFixed(3)}deg`);
  };

  const scheduleAvatarMotion = () => {
    if (!frame) frame = window.requestAnimationFrame(applyAvatarMotion);
  };

  const resetAvatarMotion = () => {
    targetX = 0;
    targetY = 0;
    targetRotate = 0;
    scheduleAvatarMotion();
  };

  if ("IntersectionObserver" in window) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isHeroVisible = Boolean(entry?.isIntersecting);
        if (!isHeroVisible) resetAvatarMotion();
      },
      { root: null, rootMargin: "0px", threshold: 0 }
    );
    heroObserver.observe(hero);
  }

  hero.addEventListener(
    "pointermove",
    (event) => {
      if (!isHeroVisible) return;
      const rect = hero.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;

      targetX = relX * 26;
      targetY = relY * 18;
      targetRotate = relX * 1.4;
      scheduleAvatarMotion();
    },
    { passive: true }
  );

  hero.addEventListener(
    "pointerleave",
    resetAvatarMotion,
    { passive: true }
  );
})();
