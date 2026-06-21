export function initSiteNavbar(options = {}) {
  const {
    mobileBreakpoint = 768,
    scrollThreshold = 8,
    closeOnHashChange = true,
    syncOnPageShow = true,
  } = options;

  const menuToggle = document.getElementById("menuToggle");
  const menuWrap = document.getElementById("menuWrap");
  const navbar = document.querySelector(".navbar");

  const updateNavbarScrolledState = () => {
    if (!navbar) return;
    navbar.classList.toggle("navbar--scrolled", window.scrollY > scrollThreshold);
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

    menuWrap.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
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
    window.addEventListener("scroll", updateNavbarScrolledState, { passive: true });
  }

  return {
    navbar,
    scrollThreshold,
    updateNavbarScrolledState,
  };
}
