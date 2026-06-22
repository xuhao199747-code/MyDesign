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
  initSiteLayoutModule: () => ({
    homeLayoutConfig: getSiteConfigSection("homeLayout"),
  }),
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
