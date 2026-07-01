(function registerSiteUtils() {
  const hasOwn = (object, key) =>
    Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);

  const siteUtils = {
    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    },
    randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    },
    getNumberOption(object, key, fallback) {
      if (!hasOwn(object, key)) return fallback;
      const value = object[key];
      return typeof value === "number" && Number.isFinite(value) ? value : fallback;
    },
    getBooleanOption(object, key, fallback) {
      if (!hasOwn(object, key)) return fallback;
      const value = object[key];
      return typeof value === "boolean" ? value : fallback;
    },
    getArrayOption(object, key, fallback) {
      if (!hasOwn(object, key)) return fallback;
      const value = object[key];
      return Array.isArray(value) ? value : fallback;
    },
    getStringOption(object, key, fallback) {
      if (!hasOwn(object, key)) return fallback;
      const value = object[key];
      return typeof value === "string" ? value : fallback;
    },
    clearTextSelection() {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        (activeElement.matches("input, textarea, [contenteditable='true']") ||
          activeElement.isContentEditable)
      ) {
        return;
      }
      const selection = globalThis.getSelection?.();
      if (selection && selection.rangeCount > 0) {
        selection.removeAllRanges();
      }
    },
  };

  globalThis.__siteUtils = siteUtils;
  if (typeof window !== "undefined") {
    window.__siteUtils = siteUtils;
  }
})();
