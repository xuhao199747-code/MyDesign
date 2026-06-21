(function registerSiteShellModule() {
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

    const nav = document.querySelector(".navbar");
    const toggle = document.getElementById("menuToggle");
    const wrap = document.getElementById("menuWrap");
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

    if (nav && toggle && wrap && nav.dataset.siteShellReady !== "true") {
      nav.dataset.siteShellReady = "true";
      let scrollFrame = null;

      const syncNavbarState = () => {
        const y = window.scrollY || window.pageYOffset;
        nav.classList.toggle("navbar--scrolled", y > navbarScrollThreshold);
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

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('a[href^="#"]');
      if (!(link instanceof HTMLAnchorElement)) return;

      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - anchorOffset;
      window.scrollTo({ top: y, behavior: "smooth" });

      if (window.location.hash !== href) {
        window.history.replaceState(null, "", href);
      }
    });
  }

  if (!window.__siteModules) window.__siteModules = {};
  window.__siteModules.initSiteShellModule = initSiteShellModule;
})();
