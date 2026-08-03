(function registerNearViewportMediaLoader() {
  const init = () => {
    if (window.__siteMediaLoader?.initialized) return;
    const candidates = Array.from(document.querySelectorAll("img[loading='lazy'], video[preload='none']"));
    const state = (window.__siteMediaLoader = {
      initialized: true,
      rootMargin: "180% 0px",
      observed: candidates.length,
      promoted: 0,
      ready: 0,
    });

    const promote = (element) => {
      if (!element || element.dataset.mediaPromoted === "true") return;
      element.dataset.mediaPromoted = "true";
      element.loading = "eager";
      try { element.fetchPriority = "low"; } catch {}
      state.promoted += 1;
      const markReady = () => {
        if (element.dataset.mediaReady === "true") return;
        element.dataset.mediaReady = "true";
        state.ready += 1;
        window.dispatchEvent(new CustomEvent("site:media-ready", { detail: { element } }));
      };
      if (element.complete && element.naturalWidth > 0) {
        markReady();
      } else {
        element.addEventListener("load", markReady, { once: true, passive: true });
        element.addEventListener("error", markReady, { once: true, passive: true });
        if (typeof element.decode === "function") element.decode().then(markReady, markReady);
      }
    };

    if (!("IntersectionObserver" in window)) {
      candidates.forEach(promote);
      state.promote = promote;
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.intersectionRatio <= 0) return;
        promote(entry.target);
        observer.unobserve(entry.target);
      });
    }, { root: null, rootMargin: state.rootMargin, threshold: 0 });
    candidates.forEach((element) => observer.observe(element));
    state.promote = promote;
    state.observer = observer;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
