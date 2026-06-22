(function registerSiteSections() {
  const siteRuntime = globalThis.__siteRuntime || {};
  const queryElement =
    siteRuntime.queryElement || ((selector, root = document) => root.querySelector(selector));
  const queryElements =
    siteRuntime.queryElements ||
    ((selector, root = document) => Array.from(root.querySelectorAll(selector)));
  const querySection = (name) => queryElement(`[data-site-section="${name}"]`);
  const querySectionNode = (section, nodeName) =>
    queryElement(`[data-section-node="${nodeName}"]`, section || document);
  const queryShell = (name) => queryElement(`[data-site-shell="${name}"]`);
  const queryShellNode = (shell, nodeName) =>
    queryElement(`[data-shell-node="${nodeName}"]`, shell || document);
  const querySystemNode = (nodeName) => queryElement(`[data-system-node="${nodeName}"]`);
  const sectionCache = {
    system: null,
    shell: null,
    home: null,
  };

  function getSystemElements() {
    if (sectionCache.system) {
      return sectionCache.system;
    }

    sectionCache.system = {
      preloader: querySystemNode("preloader"),
      preloaderBar: querySystemNode("preloader-bar"),
      preloaderText: querySystemNode("preloader-text"),
      preloaderTypeText: querySystemNode("preloader-type-text"),
      cursorRoot: querySystemNode("cursor-root"),
      assistantRoot: querySystemNode("assistant-root"),
    };

    return sectionCache.system;
  }

  function getShellElements() {
    if (sectionCache.shell) {
      return sectionCache.shell;
    }

    const primaryShell = queryShell("primary");

    sectionCache.shell = {
      primary: {
        root: primaryShell,
        navbar: queryShellNode(primaryShell, "navbar"),
        brand: queryShellNode(primaryShell, "brand"),
        menuToggle: queryShellNode(primaryShell, "menu-toggle"),
        menuWrap: queryShellNode(primaryShell, "menu-wrap"),
      },
    };

    return sectionCache.shell;
  }

  function getHomeSectionElements() {
    if (sectionCache.home) {
      return sectionCache.home;
    }

    const homeSection = querySection("home");
    const aboutSection = querySection("about");
    const photoSection = querySection("photo");
    const portfolioSection = querySection("portfolio");
    const featuredSection = querySection("featured");
    const footerSection = querySection("footer");

    sectionCache.home = {
      home: {
        section: homeSection,
        tracker: querySectionNode(homeSection, "head-tracker"),
        trackerStage: querySectionNode(homeSection, "head-tracker-stage"),
        trackerPoster: querySectionNode(homeSection, "head-tracker-poster"),
        trackerCanvas: querySectionNode(homeSection, "head-tracker-canvas"),
        heroNav: querySectionNode(homeSection, "hero-nav"),
        heroTextLeft: querySectionNode(homeSection, "hero-nav-text-left"),
        heroTextRight: querySectionNode(homeSection, "hero-nav-text-right"),
        heroTexts: queryElements(".hero-nav__text", querySectionNode(homeSection, "hero-nav") || homeSection || document),
      },
      about: {
        section: aboutSection,
        head: querySectionNode(aboutSection, "about-head"),
        intro: querySectionNode(aboutSection, "about-intro"),
        introAvatar: querySectionNode(aboutSection, "about-intro-avatar"),
        introEmoji: querySectionNode(aboutSection, "about-intro-emoji"),
        logoWall: querySectionNode(aboutSection, "logo-wall"),
        logoItems: queryElements("img", querySectionNode(aboutSection, "logo-wall") || aboutSection || document),
      },
      photo: {
        section: photoSection,
        title: querySectionNode(photoSection, "photo-title"),
        content: querySectionNode(photoSection, "photo-content"),
        metaLeft: querySectionNode(photoSection, "photo-meta-left"),
        metaLeftLabel: querySectionNode(photoSection, "photo-meta-left-label"),
        metaLeftValue: querySectionNode(photoSection, "photo-meta-left-value"),
        metaRight: querySectionNode(photoSection, "photo-meta-right"),
        metaRightLabel: querySectionNode(photoSection, "photo-meta-right-label"),
        metaRightValue: querySectionNode(photoSection, "photo-meta-right-value"),
        imagesWrap: querySectionNode(photoSection, "photo-images"),
        frontImage:
          queryElement(
            ".photo-image-front",
            querySectionNode(photoSection, "photo-images") || photoSection || document
          ),
        copy: querySectionNode(photoSection, "photo-copy"),
        copyPrimary: querySectionNode(photoSection, "photo-copy-line-primary"),
        copySecondary: querySectionNode(photoSection, "photo-copy-line-secondary"),
      },
      portfolio: {
        section: portfolioSection,
        title: querySectionNode(portfolioSection, "portfolio-title"),
        gallery: querySectionNode(portfolioSection, "portfolio-gallery"),
        bounceRoot: querySectionNode(portfolioSection, "portfolio-bounce-root"),
        cardsRoot: queryElement(".portfolio-cards", portfolioSection || document),
      },
      featured: {
        section: featuredSection,
        head: querySectionNode(featuredSection, "featured-head"),
        title: querySectionNode(featuredSection, "featured-title"),
        root: querySectionNode(featuredSection, "featured-root"),
        stage: querySectionNode(featuredSection, "featured-stage"),
        cards: queryElements("[data-featured-card]", querySectionNode(featuredSection, "featured-stage") || featuredSection || document),
        actions: querySectionNode(featuredSection, "featured-actions"),
        prevButton: querySectionNode(featuredSection, "featured-prev"),
        nextButton: querySectionNode(featuredSection, "featured-next"),
        titleLink: querySectionNode(featuredSection, "featured-title-link"),
        dragProxy: querySectionNode(featuredSection, "featured-drag-proxy"),
      },
      footer: {
        section: footerSection,
        panel: querySectionNode(footerSection, "footer-panel"),
        contain: querySectionNode(footerSection, "footer-contain"),
        grid: querySectionNode(footerSection, "footer-grid"),
        itemFollow: querySectionNode(footerSection, "footer-item-follow"),
        followLabel: querySectionNode(footerSection, "footer-follow-label"),
        followValue: querySectionNode(footerSection, "footer-follow-value"),
        itemLocation: querySectionNode(footerSection, "footer-item-location"),
        locationLabel: querySectionNode(footerSection, "footer-location-label"),
        locationValue: querySectionNode(footerSection, "footer-location-value"),
        itemPhone: querySectionNode(footerSection, "footer-item-phone"),
        phoneLabel: querySectionNode(footerSection, "footer-phone-label"),
        phoneValue: querySectionNode(footerSection, "footer-phone-value"),
        itemEmail: querySectionNode(footerSection, "footer-item-email"),
        emailLabel: querySectionNode(footerSection, "footer-email-label"),
        emailLink: querySectionNode(footerSection, "footer-email-link"),
        bar: querySectionNode(footerSection, "footer-bar"),
        barInner: querySectionNode(footerSection, "footer-bar-inner"),
        copy: querySectionNode(footerSection, "footer-copy"),
        topLink: querySectionNode(footerSection, "footer-top-link"),
      },
    };

    return sectionCache.home;
  }

  function resetSiteSectionCache() {
    sectionCache.system = null;
    sectionCache.shell = null;
    sectionCache.home = null;
  }

  const siteSections = {
    getSystemElements,
    getShellElements,
    getHomeSectionElements,
    resetSiteSectionCache,
  };

  globalThis.__siteSections = siteSections;
  if (typeof window !== "undefined") {
    window.__siteSections = siteSections;
  }
})();
