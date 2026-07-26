(function () {
  function enhanceNavbar() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    navbar.classList.add("glass-surface", "glass-surface--svg");
    navbar.dataset.siteShell = "primary";
    navbar.dataset.shellNode = "navbar";

    const brand = navbar.querySelector(".brand");
    const toggle = navbar.querySelector("#menuToggle");
    const menuWrap = navbar.querySelector("#menuWrap");
    if (brand) brand.dataset.shellNode = "brand";
    if (toggle) {
      toggle.dataset.shellNode = "menu-toggle";
      toggle.setAttribute("aria-expanded", toggle.getAttribute("aria-expanded") || "false");
    }
    if (menuWrap) {
      menuWrap.dataset.shellNode = "menu-wrap";
      menuWrap.setAttribute("aria-label", "主导航");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceNavbar);
  } else {
    enhanceNavbar();
  }
})();
