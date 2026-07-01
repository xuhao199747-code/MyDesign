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

    cards.forEach((card, index) => {
      if (card.dataset.moreWorkReady === "true") return;
      card.dataset.moreWorkReady = "true";
      card.style.setProperty("--more-card-index", String(index));
    });

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
