(function registerMoreWorkCardsModule() {
  const siteRuntime = window.__siteRuntime || {};
  const queryElements =
    siteRuntime.queryElements ||
    ((selector, root = document) => Array.from(root.querySelectorAll(selector)));
  const registerSiteModule =
    siteRuntime.registerSiteModule ||
    ((moduleName, initModule) => {
      if (!window.__siteModules) window.__siteModules = {};
      window.__siteModules[moduleName] = initModule;
    });

  function initMoreWorkCardsModule() {
    const cards = queryElements(".more-work-card");
    if (!cards.length) return;
    const visibleCards = new Set();

    const syncCardTextMetrics = (card) => {
      const surface = card.querySelector(".more-work-card__surface");
      if (!surface) return;
      const pseudoBefore = getComputedStyle(surface, "::before");
      const surfaceWidth = surface.getBoundingClientRect().width || card.getBoundingClientRect().width || 280;
      const titleHeight = parseFloat(pseudoBefore.fontSize) || 24;
      const desc = surface.dataset.cardDesc?.trim() || "";
      const descFontSize = 14;
      const descLineHeight = Math.ceil(descFontSize * 1.32);
      const descMeasure = document.createElement("canvas").getContext("2d");
      if (descMeasure) {
        descMeasure.font =
          '400 14px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      }
      const measuredDescWidth = descMeasure
        ? descMeasure.measureText(desc).width
        : Array.from(desc).reduce((total, char) => total + (/[\u4e00-\u9fa5]/.test(char) ? 14 : 7), 0);
      const descMaxWidth = Math.max(1, surfaceWidth - 32);
      const descLines = Math.max(1, Math.min(4, Math.ceil(measuredDescWidth / descMaxWidth)));
      const descHeight = descLines * descLineHeight;
      card.style.setProperty("--more-card-title-height", `${Math.ceil(titleHeight)}px`);
      card.style.setProperty("--more-card-desc-height", `${descHeight}px`);
    };

    cards.forEach((card, index) => {
      if (card.dataset.moreWorkReady === "true") return;
      card.dataset.moreWorkReady = "true";
      card.style.setProperty("--more-card-index", String(index));
      syncCardTextMetrics(card);
    });

    window.addEventListener(
      "resize",
      () => cards.forEach(syncCardTextMetrics),
      { passive: true }
    );

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            visibleCards.add(entry.target);
            requestScrollDrift();
          } else {
            visibleCards.delete(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "24% 0px 24% 0px" }
    );

    cards.forEach((card) => revealObserver.observe(card));

    let ticking = false;
    const updateScrollDrift = () => {
      ticking = false;
      const cardsToUpdate = visibleCards.size ? Array.from(visibleCards) : [];
      cardsToUpdate.forEach((card) => {
        const index = cards.indexOf(card);
        const rect = card.getBoundingClientRect();
        const viewportCenter = window.innerHeight * 0.5;
        const cardCenter = rect.top + rect.height * 0.5;
        const progress = Math.max(-1, Math.min(1, (cardCenter - viewportCenter) / viewportCenter));
        const direction = index % 2 === 0 ? -1 : 1;
        card.style.setProperty("--more-card-y", `${progress * direction * 12}px`);
        card.style.setProperty("--more-card-x", `${progress * direction * 5}px`);
      });
    };

    const requestScrollDrift = () => {
      if (!visibleCards.size) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScrollDrift);
    };

    window.addEventListener("scroll", requestScrollDrift, { passive: true });
    window.addEventListener("resize", requestScrollDrift, { passive: true });
  }

  registerSiteModule("initMoreWorkCardsModule", initMoreWorkCardsModule);
})();
