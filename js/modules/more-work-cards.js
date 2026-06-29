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
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    cards.forEach((card, index) => {
      if (card.dataset.moreWorkReady === "true") return;
      card.dataset.moreWorkReady = "true";
      card.style.setProperty("--more-card-index", String(index));
      if (reduceMotion) return;
      let pendingPointerEvent = null;
      let tiltFrame = 0;

      const applyTiltFromPointer = (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--more-card-ry", `${x * 7}deg`);
        card.style.setProperty("--more-card-rx", `${y * -6}deg`);
      };

      const setTiltFromPointer = (event) => {
        pendingPointerEvent = event;
        if (tiltFrame) return;
        tiltFrame = requestAnimationFrame(() => {
          tiltFrame = 0;
          if (pendingPointerEvent) applyTiltFromPointer(pendingPointerEvent);
        });
      };

      const resetTilt = () => {
        if (tiltFrame) {
          cancelAnimationFrame(tiltFrame);
          tiltFrame = 0;
        }
        pendingPointerEvent = null;
        card.classList.remove("is-pointer-active");
        card.style.setProperty("--more-card-rx", "0deg");
        card.style.setProperty("--more-card-ry", "0deg");
      };

      card.addEventListener("pointerenter", (event) => {
        card.classList.add("is-pointer-active");
        setTiltFromPointer(event);
      });
      card.addEventListener("pointermove", setTiltFromPointer);
      card.addEventListener("pointerleave", resetTilt);
      card.addEventListener("pointercancel", resetTilt);
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    cards.forEach((card) => revealObserver.observe(card));

    let ticking = false;
    const updateScrollDrift = () => {
      ticking = false;
      cards.forEach((card, index) => {
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
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScrollDrift);
    };

    updateScrollDrift();
    window.addEventListener("scroll", requestScrollDrift, { passive: true });
    window.addEventListener("resize", requestScrollDrift, { passive: true });
  }

  registerSiteModule("initMoreWorkCardsModule", initMoreWorkCardsModule);
})();
