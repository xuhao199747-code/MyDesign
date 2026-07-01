(function registerSiteShellModule() {
  const siteRuntime = window.__siteRuntime || {};
  const siteSections = window.__siteSections || {};
  const getElementById =
    siteRuntime.getElementById || ((elementId) => document.getElementById(elementId));
  const queryElement =
    siteRuntime.queryElement || ((selector, root = document) => root.querySelector(selector));
  const registerSiteModule =
    siteRuntime.registerSiteModule ||
    ((moduleName, initModule) => {
      if (!window.__siteModules) window.__siteModules = {};
      window.__siteModules[moduleName] = initModule;
    });

  function initSiteShellModule(options = {}) {
    const {
      shellConfig = {},
      siteUtils = {
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
        getBooleanOption(_object, _key, fallback) {
          return fallback;
        },
      },
    } = options;
    const shellElements = siteSections.getShellElements?.().primary || {};
    const nav = shellElements.navbar || queryElement(".navbar");
    const toggle = shellElements.menuToggle || getElementById("menuToggle");
    const wrap = shellElements.menuWrap || getElementById("menuWrap");
    const navbarScrollThreshold = siteUtils.getNumberOption(
      shellConfig,
      "navbarScrollThreshold",
      40
    );
    const anchorOffset = siteUtils.getNumberOption(
      shellConfig,
      "anchorOffset",
      72
    );
    const mobileMenuOutsideClose = siteUtils.getBooleanOption(
      shellConfig,
      "mobileMenuOutsideClose",
      true
    );

    const navLinks = wrap
      ? Array.from(wrap.querySelectorAll('a[href^="#"]')).filter((link) => {
          const href = link.getAttribute("href");
          return href && href !== "#";
        })
      : [];
    let activeNavTarget = null;
    let activeNavTargetWasVisible = false;
    let activeNavProtectedUntil = 0;

    const setActiveNavLink = (activeLink) => {
      navLinks.forEach((link) => {
        const isActive = link === activeLink;
        if (isActive) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    };

    const clearActiveNavLink = () => {
      activeNavTarget = null;
      activeNavTargetWasVisible = false;
      setActiveNavLink(null);
    };

    window.__clearActiveNavLink = clearActiveNavLink;

    const isSectionInActiveView = (section) => {
      if (!(section instanceof Element)) return false;
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      return rect.top < viewportHeight * 0.72 && rect.bottom > viewportHeight * 0.28;
    };

    const syncActiveNavVisibility = () => {
      if (!activeNavTarget) return;
      if (performance.now() < activeNavProtectedUntil) return;
      if (activeNavTarget.id === "contact") {
        const maxScroll = Math.max(
          document.documentElement.scrollHeight - window.innerHeight,
          0
        );
        if (Math.abs(window.scrollY - maxScroll) <= 4) {
          activeNavTargetWasVisible = true;
          return;
        }
      }
      const isVisible = isSectionInActiveView(activeNavTarget);
      if (isVisible) {
        activeNavTargetWasVisible = true;
        return;
      }
      if (activeNavTargetWasVisible) {
        clearActiveNavLink();
      }
    };

    window.__preserveActiveNavFor = (durationMs = 900) => {
      activeNavProtectedUntil = Math.max(
        activeNavProtectedUntil,
        performance.now() + durationMs
      );
    };

    window.__restoreContactNavActive = (durationMs = 2400) => {
      if (window.location.hash !== "#contact") return;
      const contactLink = navLinks.find(
        (link) => link.getAttribute("href") === "#contact"
      );
      const contactTarget = queryElement("#contact");
      if (!contactLink || !contactTarget) return;
      activeNavTarget = contactTarget;
      activeNavTargetWasVisible = true;
      activeNavProtectedUntil = Math.max(
        activeNavProtectedUntil,
        performance.now() + durationMs
      );
      setActiveNavLink(contactLink);
    };

    const syncActiveNavFromHash = () => {
      if (!window.location.hash) return;
      const activeLink = navLinks.find(
        (link) => link.getAttribute("href") === window.location.hash
      );
      if (activeLink) {
        activeNavTarget = queryElement(window.location.hash);
        activeNavTargetWasVisible = activeNavTarget ? isSectionInActiveView(activeNavTarget) : false;
        setActiveNavLink(activeLink);
      }
    };

    if (nav && toggle && wrap && nav.dataset.siteShellReady !== "true") {
      nav.dataset.siteShellReady = "true";
      let scrollFrame = null;

      const syncNavbarState = () => {
        const y = window.scrollY || window.pageYOffset;
        nav.classList.toggle("navbar--scrolled", y > navbarScrollThreshold);
        syncActiveNavVisibility();
        scrollFrame = null;
      };

      const onScroll = () => {
        if (scrollFrame) return;
        scrollFrame = window.requestAnimationFrame(syncNavbarState);
      };

      const closeMenu = () => {
        wrap.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      };

      const openMenu = () => {
        wrap.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
      };

      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });

      toggle.addEventListener("click", () => {
        if (wrap.classList.contains("open")) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      wrap.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;
        if (!event.target.closest("a")) return;
        closeMenu();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (!wrap.classList.contains("open")) return;
        closeMenu();
      });

      if (mobileMenuOutsideClose) {
        document.addEventListener("click", (event) => {
          if (!wrap.classList.contains("open")) return;
          if (nav.contains(event.target)) return;
          closeMenu();
        });
      }
    }

    if (document.body.dataset.anchorScrollReady === "true") return;
    document.body.dataset.anchorScrollReady = "true";
    syncActiveNavFromHash();

    const scrollToContactBottom = (link, target) => {
      if (typeof window.__forceCloseNavWechatCard === "function") {
        window.__forceCloseNavWechatCard();
      } else {
        window.__closeNavWechatCard?.();
      }
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        0
      );
      window.scrollTo({ top: maxScroll, behavior: "auto" });

      if (window.location.hash !== "#contact") {
        window.history.replaceState(null, "", "#contact");
      }
      activeNavTarget = target;
      activeNavTargetWasVisible = true;
      activeNavProtectedUntil = performance.now() + 900;
      setActiveNavLink(link);
    };

    document.addEventListener(
      "click",
      (event) => {
        if (!(event.target instanceof Element)) return;
        const link = event.target.closest('[data-shell-node="contact-trigger"][href="#contact"]');
        if (!(link instanceof HTMLAnchorElement)) return;

        const target = queryElement("#contact");
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        event.__contactScrollHandled = true;
        scrollToContactBottom(link, target);
      },
      true
    );

    document.addEventListener("click", (event) => {
      if (event.__contactScrollHandled) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('a[href^="#"]');
      if (!(link instanceof HTMLAnchorElement)) return;

      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = queryElement(href);
      if (!target) return;

      event.preventDefault();
      const isBrandLink = link.classList.contains("brand");
      const isContactLink = href === "#contact";
      if (isContactLink) {
        scrollToContactBottom(link, target);
        return;
      }
      const y = isBrandLink
        ? 0
        : target.getBoundingClientRect().top + window.scrollY - anchorOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });

      if (window.location.hash !== href) {
        window.history.replaceState(null, "", href);
      }
      activeNavTarget = target;
      activeNavTargetWasVisible = false;
      setActiveNavLink(link);
    });
  }

  registerSiteModule("initSiteShellModule", initSiteShellModule);
})();
