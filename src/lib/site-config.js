export function getSiteConfigSection(sectionName, fallbackValue = {}) {
  if (typeof globalThis.__getSiteConfigSection === "function") {
    return globalThis.__getSiteConfigSection(sectionName) || fallbackValue;
  }

  const siteConfig = globalThis.__siteConfig;
  if (siteConfig && typeof siteConfig === "object") {
    return siteConfig[sectionName] || fallbackValue;
  }

  return fallbackValue;
}
