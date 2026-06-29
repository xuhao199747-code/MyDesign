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
  initPortfolioFeaturedModule: () =>
    buildConfigOptions("portfolioFeatured", { siteUtils, siteHelpers }),
  initHeadTrackerModule: () => buildConfigOptions("headTracker", { siteHelpers, siteUtils }),
  initPlayfulTitleHoverModule: getPlayfulTitleOptions,
  initLogoPhysicsModule: () => buildConfigOptions("logoPhysics", { siteHelpers, siteUtils }),
  initClickSurpriseBurstModule: () => buildConfigOptions("clickSurprise", { siteUtils }),
  initFooterMorphPanelModule: () => ({ siteUtils }),
};

const moduleBootOrder = Object.keys(moduleOptionFactories);

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

moduleBootOrder.forEach((moduleName) => {
  const initModule = siteModules[moduleName];
  const options = moduleOptionFactories[moduleName]?.() || {};
  if (typeof initModule !== "function") {
    recordBootStatus(moduleName, "missing");
    return;
  }

  try {
    initModule(options);
    recordBootStatus(moduleName, "initialized");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordBootStatus(moduleName, "failed", message);
    console.error(`[site-boot] ${moduleName} failed`, error);
    if (bootConfig.continueOnError === false) {
      throw error;
    }
  }
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
  const trigger = document.querySelector('[data-shell-node="wechat-trigger"]');
  const drop = document.getElementById("navWechatDrop");
  if (!trigger || !drop || drop.dataset.wechatDropControllerReady === "true") return;

  drop.dataset.wechatDropControllerReady = "true";
  let isOpen = false;
  let openScrollY = 0;
  let scrollWatchFrame = null;
  let closeTimer = null;

  const updatePosition = () => {
    const rect = trigger.getBoundingClientRect();
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
    trigger.setAttribute("aria-expanded", "false");
    closeTimer = window.setTimeout(() => {
      drop.classList.remove("is-open", "is-closing");
      drop.setAttribute("aria-hidden", "true");
      closeTimer = null;
    }, 360);
  };

  const watchScrollWhileOpen = () => {
    if (!isOpen) return;
    if (Math.abs(window.scrollY - openScrollY) > 2) {
      closeCard();
      return;
    }
    scrollWatchFrame = window.requestAnimationFrame(watchScrollWhileOpen);
  };

  const openCard = () => {
    updatePosition();
    isOpen = true;
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    openScrollY = window.scrollY;
    drop.classList.remove("is-closing", "is-opening");
    drop.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
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

    const rect = trigger.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  };

  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  window.__toggleNavWechatCard = toggleCard;
  window.__closeNavWechatCard = closeCard;

  trigger.addEventListener("click", toggleCard);

  document.addEventListener(
    "click",
    (event) => {
      if (!isOpen) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const navLink = target.closest(".navbar a");
      if (!navLink || navLink === trigger || navLink.contains(trigger)) return;
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
    if (isOpen) closeCard();
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (isOpen) updatePosition();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) closeCard();
  });

  document.addEventListener("click", (event) => {
    if (!isOpen || drop.contains(event.target) || trigger.contains(event.target)) return;
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

  const applyAvatarMotion = () => {
    frame = null;
    hero.style.setProperty("--avatar-x", `${targetX.toFixed(2)}px`);
    hero.style.setProperty("--avatar-y", `${targetY.toFixed(2)}px`);
    hero.style.setProperty("--avatar-rotate", `${targetRotate.toFixed(3)}deg`);
  };

  const scheduleAvatarMotion = () => {
    if (!frame) frame = window.requestAnimationFrame(applyAvatarMotion);
  };

  hero.addEventListener(
    "pointermove",
    (event) => {
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
    () => {
      targetX = 0;
      targetY = 0;
      targetRotate = 0;
      scheduleAvatarMotion();
    },
    { passive: true }
  );
})();
