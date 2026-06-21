/**
 * Homepage bootstrap.
 * Module files under js/modules register init functions onto window.__siteModules.
 * This file is the single orchestration layer that runs them exactly once.
 */

const siteConfig = window.__siteConfig || {};
const siteUtils = window.__siteUtils || {};
const siteHelpers = window.__siteHelpers || {};
const siteModules = window.__siteModules || {};
const bootConfig = siteConfig.boot || {};

const moduleOptionFactories = {
  initSiteShellModule: () => ({
    shellConfig: siteConfig.shell || {},
    siteUtils,
  }),
  initPreloaderModule: () => ({
    preloaderConfig: siteConfig.preloader || {},
    siteUtils,
  }),
  initHeroTextFloatModule: () => ({
    heroTextFloatConfig: siteConfig.heroTextFloat || {},
    siteUtils,
  }),
  initPhotoRevealModule: () => ({
    photoRevealConfig: siteConfig.photoReveal || {},
    siteUtils,
    siteHelpers,
  }),
  initWorksSwipePreviewModule: () => ({
    worksSwipePreviewConfig: siteConfig.worksSwipePreview || {},
    siteUtils,
  }),
  initPortfolioInfiniteCardsModule: () => ({
    infiniteCardsConfig: siteConfig.infiniteCards || {},
    siteUtils,
    siteHelpers,
  }),
  initPortfolioFeaturedModule: () => ({
    featuredConfig: siteConfig.portfolioFeatured || {},
    siteUtils,
    siteHelpers,
  }),
  initHeadTrackerModule: () => ({
    headTrackerConfig: siteConfig.headTracker || {},
    siteHelpers,
    siteUtils,
  }),
  initPlayfulTitleHoverModule: () => ({
    selectors: siteConfig.playfulTitle?.selectors || [],
    rotatePattern: siteConfig.playfulTitle?.rotatePattern || [],
    assets: siteConfig.playfulTitle?.assets || {},
  }),
  initLogoPhysicsModule: () => ({
    logoPhysicsConfig: siteConfig.logoPhysics || {},
    siteHelpers,
    siteUtils,
  }),
  initClickSurpriseBurstModule: () => ({
    clickSurpriseConfig: siteConfig.clickSurprise || {},
    siteUtils,
  }),
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
