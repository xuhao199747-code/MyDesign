import { getElementById, queryElement } from "./dom-target.js";
import { getSiteConfigSection } from "./site-config.js";

export function initSiteNavbar(options = {}) {
  const navbarConfig = getSiteConfigSection("navbar");
  const {
    mobileBreakpoint = navbarConfig.mobileBreakpoint ?? 768,
    scrollThreshold = navbarConfig.scrollThreshold ?? 8,
    closeOnHashChange = navbarConfig.closeOnHashChange ?? true,
    syncOnPageShow = navbarConfig.syncOnPageShow ?? true,
  } = options;

  const menuToggle = getElementById("menuToggle");
  const menuWrap = getElementById("menuWrap");
  const navbar = queryElement(".navbar");
  let scrollFrame = 0;

  const updateNavbarScrolledState = () => {
    if (!navbar) return;
    navbar.classList.toggle("navbar--scrolled", window.scrollY > scrollThreshold);
  };

  const queueNavbarScrolledState = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      updateNavbarScrolledState();
    });
  };

  if (menuToggle && menuWrap) {
    const isMobileViewport = () => window.innerWidth <= mobileBreakpoint;
    let toggleClickLock = false;
    const isMenuOpen = () => menuWrap.classList.contains("open");

    const syncMenuOpenState = () => {
      const isOpen = isMobileViewport() && isMenuOpen();
      document.body.classList.toggle("menu-open", isOpen);
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    };

    const setMenuOpen = (open) => {
      menuWrap.classList.toggle("open", open);
      syncMenuOpenState();
    };

    const closeMenu = () => {
      setMenuOpen(false);
    };

    const handleTogglePress = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (toggleClickLock) return;
      toggleClickLock = true;
      setMenuOpen(!isMenuOpen());
      window.setTimeout(() => {
        toggleClickLock = false;
      }, 0);
    };

    menuToggle.addEventListener("pointerdown", handleTogglePress);

    menuWrap.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("a")) return;
      closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (!isMobileViewport()) return;
      if (!menuWrap.classList.contains("open")) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (menuWrap.contains(target) || menuToggle.contains(target)) return;
      closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > mobileBreakpoint) {
        closeMenu();
      }
    });

    if (closeOnHashChange) {
      window.addEventListener("hashchange", closeMenu);
    }

    if (syncOnPageShow) {
      window.addEventListener("pageshow", syncMenuOpenState);
    }

    syncMenuOpenState();
  }

  if (navbar) {
    updateNavbarScrolledState();
    window.addEventListener("scroll", queueNavbarScrolledState, { passive: true });
  }

  return {
    navbar,
    scrollThreshold,
    updateNavbarScrolledState,
  };
}
