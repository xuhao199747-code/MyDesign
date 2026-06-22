(function registerSiteLayoutModule() {
  const siteRuntime = window.__siteRuntime || {};
  const siteSections = window.__siteSections || {};
  const registerSiteModule =
    siteRuntime.registerSiteModule ||
    ((moduleName, initModule) => {
      if (!window.__siteModules) window.__siteModules = {};
      window.__siteModules[moduleName] = initModule;
    });

  function applySectionLayout(section, config = {}) {
    if (!section) return;
    if (config.layoutSection) {
      section.dataset.layoutSection = config.layoutSection;
    }
    if (config.contentWidth) {
      section.style.setProperty("--layout-content-width", config.contentWidth);
    }
    if (config.titleGap) {
      section.style.setProperty("--layout-title-gap", config.titleGap);
    }
    if (config.vars && typeof config.vars === "object") {
      Object.entries(config.vars).forEach(([name, value]) => {
        if (typeof value !== "string") return;
        section.style.setProperty(name, value);
      });
    }
  }

  function applyNodeLayout(node, layoutNode) {
    if (!node || !layoutNode) return;
    node.dataset.layoutNode = layoutNode;
  }

  function applySectionNodeLayouts(sectionElements = {}, nodeConfig = {}) {
    Object.entries(nodeConfig).forEach(([key, layoutNode]) => {
      applyNodeLayout(sectionElements[key], layoutNode);
    });
  }

  function initSiteLayoutModule(options = {}) {
    const { homeLayoutConfig = {} } = options;
    const sections = siteSections.getHomeSectionElements?.() || {};

    Object.entries(homeLayoutConfig).forEach(([sectionName, config]) => {
      const sectionElements = sections[sectionName] || {};
      applySectionLayout(sectionElements.section, config.section || {});
      applySectionNodeLayouts(sectionElements, config.nodes || {});
    });
  }

  registerSiteModule("initSiteLayoutModule", initSiteLayoutModule);
})();
