(function registerSiteRuntime() {
  const getSiteGlobal = (key, fallbackValue = {}) => globalThis[key] || fallbackValue;

  const getSiteConfigSection = (sectionName, fallbackValue = {}) => {
    if (typeof globalThis.__getSiteConfigSection === "function") {
      return globalThis.__getSiteConfigSection(sectionName) || fallbackValue;
    }

    const siteConfig = globalThis.__siteConfig;
    if (siteConfig && typeof siteConfig === "object") {
      return siteConfig[sectionName] || fallbackValue;
    }

    return fallbackValue;
  };

  const getElementById = (elementId) => document.getElementById(elementId);
  const queryElement = (selector, root = document) => root.querySelector(selector);
  const queryElements = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));
  const querySection = (sectionName, root = document) =>
    queryElement(`[data-site-section="${sectionName}"]`, root);
  const querySectionNode = (nodeName, root = document) =>
    queryElement(`[data-section-node="${nodeName}"]`, root);
  const queryShell = (shellName, root = document) =>
    queryElement(`[data-site-shell="${shellName}"]`, root);
  const queryShellNode = (nodeName, root = document) =>
    queryElement(`[data-shell-node="${nodeName}"]`, root);

  const registerSiteModule = (moduleName, initModule) => {
    if (!globalThis.__siteModules) {
      globalThis.__siteModules = {};
    }
    globalThis.__siteModules[moduleName] = initModule;
  };

  const siteRuntime = {
    getSiteGlobal,
    getSiteConfigSection,
    getElementById,
    queryElement,
    queryElements,
    querySection,
    querySectionNode,
    queryShell,
    queryShellNode,
    registerSiteModule,
  };

  globalThis.__siteRuntime = siteRuntime;
  if (typeof window !== "undefined") {
    window.__siteRuntime = siteRuntime;
  }
})();
