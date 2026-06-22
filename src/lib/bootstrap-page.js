import { getElementById } from "./dom-target.js";

export function runBootstrapTasks(tasks) {
  return Promise.all(tasks.map((task) => task()));
}

export function whenElementPresent(elementId, loader) {
  return () => {
    if (!getElementById(elementId)) {
      return null;
    }

    return loader();
  };
}

export function wrapBootstrapTask(task, label = "bootstrap") {
  return async () => {
    try {
      return await task();
    } catch (error) {
      console.error(`[${label}]`, error);
      return null;
    }
  };
}

export function whenBrowserIdle(task, fallbackDelay = 160) {
  return () =>
    new Promise((resolve) => {
      const runTask = () => Promise.resolve(task()).then(resolve);

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(runTask, { timeout: 1200 });
        return;
      }

      window.setTimeout(runTask, fallbackDelay);
    });
}
