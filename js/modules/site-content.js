(function registerSiteContentModule() {
  const siteRuntime = window.__siteRuntime || {};
  const siteSections = window.__siteSections || {};
  const registerSiteModule =
    siteRuntime.registerSiteModule ||
    ((moduleName, initModule) => {
      if (!window.__siteModules) window.__siteModules = {};
      window.__siteModules[moduleName] = initModule;
    });

  const defaultTemplates = {
    about: {
      logoAltPrefix: "Tool Icon",
      logoItems: [
        "./imag/logo/logo1.webp",
        "./imag/logo/logo2.webp",
        "./imag/logo/logo3.webp",
        "./imag/logo/logo4.webp",
        "./imag/logo/logo5.webp",
        "./imag/logo/logo6.webp",
        "./imag/logo/logo7.webp",
        "./imag/logo/logo8.webp",
        "./imag/logo/logo9.webp",
        "./imag/logo/logo10.webp",
        "./imag/logo/logo11.webp",
        "./imag/logo/logo12.webp",
        "./imag/logo/logo13.webp",
        "./imag/logo/logo14.webp",
        "./imag/logo/logo15.webp",
        "./imag/logo/logo16.webp",
        "./imag/logo/logo17.webp",
        "./imag/logo/logo18.png",
        "./imag/logo/logo19.png",
      ],
      introAriaLabel:
        "大家好，我是徐浩，从事产品和设计工作，专注于设计和构建数字产品、品牌和体验。",
      introGreeting: "大家好，我是",
      introName: "徐浩",
      introRole: "从事产品和设计工作💻，",
      introFocusPrefix: "专注于设计和构建",
      introFocusProducts: "数字产品🌐、",
      introFocusBrand: "品牌和体验❤️。",
      introAvatarSrc: "./imag/Frame 2085668692.png",
      introEmojiSrc: "./imag/Group 1940698323.png",
    },
    photo: {
      metaLeftLabel: "BASED",
      metaLeftValue: "杭州",
      metaRightLabel: "Designer",
      metaRightValue: "UI/UX",
      copyPrimary: "用逻辑构建界面，以温度传递品牌基因！",
      copySecondary: "让界面更有逻辑，让设计更有温度!",
    },
    featured: {
      title: "MY DESIGN",
      prevLabel: "上一张",
      nextLabel: "下一张",
      cards: [
        {
          title: "Sneakers",
          href: "./project.html?slug=sneakers",
          image: "./imag/portfolio-cards1.webp",
          alt: "Sneakers 项目",
        },
        {
          title: "Profile",
          href: "./project.html?slug=profile",
          image: "./imag/photo1.png",
          alt: "Profile 项目",
        },
        {
          title: "About",
          href: "./project.html?slug=about",
          image: "./imag/Image2.webp",
          alt: "About 项目",
        },
      ],
    },
    footer: {
      followLabel: "FOLLOW ME",
      followValue: "wechat →",
      locationLabel: "CURRENT LOCATION",
      locationValue: "浙江杭州市余杭区 →",
      phoneLabel: "Phone",
      phoneValue: "15004700137",
      emailLabel: "EMAIL me",
      emailText: "961407086@qq.com",
      emailHref: "mailto:961407086@qq.com",
      copy: "©2026 XUHAO DESIGN",
      topLinkText: "Back To Top",
    },
  };

  function setNodeText(node, value) {
    if (!node || typeof value !== "string") return;
    node.textContent = value;
  }

  function setNodeHref(node, href) {
    if (!(node instanceof HTMLAnchorElement) || typeof href !== "string") return;
    node.href = href;
  }

  function setNodeAttr(node, attrName, value) {
    if (!node || typeof value !== "string") return;
    node.setAttribute(attrName, value);
  }

  function appendTextSpan(fragment, text, options = {}) {
    const span = document.createElement("span");
    if (options.className) {
      span.className = options.className;
    }
    if (options.nodeName) {
      span.dataset.sectionNode = options.nodeName;
    }
    span.textContent = text;
    fragment.appendChild(span);
  }

  function appendSticker(fragment, options = {}) {
    const image = document.createElement("img");
    image.className = options.className || "";
    image.src = options.src || "";
    image.alt = options.alt || "";
    image.loading = "lazy";
    image.decoding = "async";
    if (options.nodeName) {
      image.dataset.sectionNode = options.nodeName;
    }
    fragment.appendChild(image);
  }

  function createPhotoMeta(label, value, rootNodeName, labelNodeName, valueNodeName) {
    const list = document.createElement("dl");
    list.className = "photo-meta m-0 flex flex-col items-start justify-center gap-2 p-0";
    list.dataset.sectionNode = rootNodeName;

    const term = document.createElement("dt");
    term.dataset.sectionNode = labelNodeName;
    term.textContent = label || "";

    const detail = document.createElement("dd");
    detail.dataset.sectionNode = valueNodeName;
    detail.textContent = value || "";

    list.append(term, detail);
    return list;
  }

  function createPhotoCopyLine(text, nodeName) {
    const line = document.createElement("p");
    line.className =
      "m-0 text-center text-[14px] font-medium leading-[1.43] text-[color:var(--color-text)]";
    line.dataset.sectionNode = nodeName;
    line.textContent = text || "";
    return line;
  }

  function createFooterItem(label, value, options = {}) {
    const item = document.createElement("div");
    item.dataset.sectionNode = options.itemNodeName || "";

    const labelNode = document.createElement("p");
    labelNode.className =
      "footer-demo__label m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70";
    if (options.labelNodeName) {
      labelNode.dataset.sectionNode = options.labelNodeName;
    }
    labelNode.textContent = label || "";

    const valueNode = document.createElement("p");
    valueNode.className =
      "footer-demo__value mt-2 text-[clamp(14px,1.6vw,17px)] font-medium leading-[1.35]";

    if (options.link) {
      const link = document.createElement("a");
      link.className =
        "border-b border-white/35 no-underline transition-colors duration-150 hover:border-white";
      if (options.valueNodeName) {
        link.dataset.sectionNode = options.valueNodeName;
      }
      link.href = options.link;
      link.textContent = value || "";
      valueNode.appendChild(link);
    } else {
      if (options.valueNodeName) {
        valueNode.dataset.sectionNode = options.valueNodeName;
      }
      valueNode.textContent = value || "";
    }

    item.append(labelNode, valueNode);
    return item;
  }

  function createFeaturedCard(item, index) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "portfolio-featured__card";
    card.dataset.featuredCard = "";
    card.dataset.index = String(index);
    card.dataset.title = item.title || "";
    card.dataset.href = item.href || "#portfolio";
    card.setAttribute("aria-label", `查看 ${item.title || `Project ${index + 1}`}`);

    const image = document.createElement("img");
    image.src = item.image || "";
    image.alt = item.alt || "";
    image.loading = "lazy";
    image.decoding = "async";
    card.appendChild(image);

    return card;
  }

  function mergeSectionContent(sectionName, homeContentConfig = {}, homeTemplateConfig = {}) {
    return {
      ...(defaultTemplates[sectionName] || {}),
      ...(homeContentConfig[sectionName] || {}),
      ...(homeTemplateConfig[sectionName] || {}),
    };
  }

  function isSectionReady(sectionElements) {
    return sectionElements?.section?.dataset.contentReady === "true";
  }

  function markSectionReady(sectionElements) {
    if (sectionElements?.section) {
      sectionElements.section.dataset.contentReady = "true";
    }
  }

  function initSectionContent(sectionElements, buildSection) {
    if (!sectionElements?.section || isSectionReady(sectionElements)) {
      return;
    }

    buildSection();
    markSectionReady(sectionElements);
  }

  function buildAboutIntro(aboutIntro, aboutContent) {
    if (!aboutIntro) return;

    const fragment = document.createDocumentFragment();
    appendTextSpan(fragment, aboutContent.introGreeting || "", {
      nodeName: "about-intro-greeting",
    });
    appendSticker(fragment, {
      nodeName: "about-intro-avatar",
      className: "section-two-intro__sticker section-two-intro__sticker--avatar",
      src: aboutContent.introAvatarSrc,
    });
    appendTextSpan(fragment, aboutContent.introName || "", {
      nodeName: "about-intro-name",
    });
    appendSticker(fragment, {
      nodeName: "about-intro-emoji",
      className: "section-two-intro__sticker section-two-intro__sticker--emoji",
      src: aboutContent.introEmojiSrc,
    });
    fragment.appendChild(document.createTextNode("，"));
    appendTextSpan(fragment, aboutContent.introRole || "", {
      nodeName: "about-intro-role",
      className: "section-two-intro__nowrap",
    });
    appendTextSpan(fragment, aboutContent.introFocusPrefix || "", {
      nodeName: "about-intro-focus-prefix",
    });
    appendTextSpan(fragment, aboutContent.introFocusProducts || "", {
      nodeName: "about-intro-focus-products",
      className: "section-two-intro__nowrap",
    });
    appendTextSpan(fragment, aboutContent.introFocusBrand || "", {
      nodeName: "about-intro-focus-brand",
      className: "section-two-intro__nowrap",
    });

    aboutIntro.replaceChildren(fragment);
    setNodeAttr(aboutIntro, "aria-label", aboutContent.introAriaLabel || "");
  }

  function buildLogoWall(logoWall, aboutContent) {
    if (!logoWall || !Array.isArray(aboutContent.logoItems) || !aboutContent.logoItems.length) {
      return;
    }

    const fragment = document.createDocumentFragment();
    const altPrefix = aboutContent.logoAltPrefix || "Tool Icon";

    aboutContent.logoItems.forEach((src, index) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = `${altPrefix} ${index + 1}`;
      image.loading = "lazy";
      image.decoding = "async";
      fragment.appendChild(image);
    });

    logoWall.replaceChildren(fragment);
  }

  function buildPhotoSection(photoElements, photoContent) {
    if (!photoElements.content) return;

    const imageWrap = photoElements.imagesWrap;
    if (!imageWrap) return;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(
      createPhotoMeta(
        photoContent.metaLeftLabel,
        photoContent.metaLeftValue,
        "photo-meta-left",
        "photo-meta-left-label",
        "photo-meta-left-value"
      )
    );
    fragment.appendChild(imageWrap);
    fragment.appendChild(
      createPhotoMeta(
        photoContent.metaRightLabel,
        photoContent.metaRightValue,
        "photo-meta-right",
        "photo-meta-right-label",
        "photo-meta-right-value"
      )
    );
    photoElements.content.replaceChildren(fragment);

    if (photoElements.copy) {
      photoElements.copy.replaceChildren(
        createPhotoCopyLine(photoContent.copyPrimary, "photo-copy-line-primary"),
        createPhotoCopyLine(photoContent.copySecondary, "photo-copy-line-secondary")
      );
    }
  }

  function buildFeaturedStage(stage, featuredContent) {
    if (!stage || !Array.isArray(featuredContent.cards) || !featuredContent.cards.length) {
      return;
    }

    const fragment = document.createDocumentFragment();
    featuredContent.cards.forEach((item, index) => {
      fragment.appendChild(createFeaturedCard(item, index));
    });
    stage.replaceChildren(fragment);
  }

  function buildFooterSection(footerElements, footerContent) {
    if (footerElements.grid) {
      footerElements.grid.replaceChildren(
        createFooterItem(footerContent.followLabel, footerContent.followValue, {
          itemNodeName: "footer-item-follow",
          labelNodeName: "footer-follow-label",
          valueNodeName: "footer-follow-value",
        }),
        createFooterItem(footerContent.locationLabel, footerContent.locationValue, {
          itemNodeName: "footer-item-location",
          labelNodeName: "footer-location-label",
          valueNodeName: "footer-location-value",
        }),
        createFooterItem(footerContent.phoneLabel, footerContent.phoneValue, {
          itemNodeName: "footer-item-phone",
          labelNodeName: "footer-phone-label",
          valueNodeName: "footer-phone-value",
        }),
        createFooterItem(footerContent.emailLabel, footerContent.emailText, {
          itemNodeName: "footer-item-email",
          labelNodeName: "footer-email-label",
          valueNodeName: "footer-email-link",
          link: footerContent.emailHref,
        })
      );
    }

    setNodeText(footerElements.copy, footerContent.copy);
    setNodeText(footerElements.topLink, footerContent.topLinkText);
  }

  function initSiteContentModule(options = {}) {
    const { homeContentConfig = {}, homeTemplateConfig = {} } = options;
    const sectionElements = siteSections.getHomeSectionElements?.() || {};
    const aboutElements = sectionElements.about || {};
    const photoElements = sectionElements.photo || {};
    const featuredElements = sectionElements.featured || {};
    const footerElements = sectionElements.footer || {};
    const aboutContent = mergeSectionContent("about", homeContentConfig, homeTemplateConfig);
    const photoContent = mergeSectionContent("photo", homeContentConfig, homeTemplateConfig);
    const featuredContent = mergeSectionContent("featured", homeContentConfig, homeTemplateConfig);
    const footerContent = mergeSectionContent("footer", homeContentConfig, homeTemplateConfig);

    initSectionContent(aboutElements, () => {
      buildLogoWall(aboutElements.logoWall, aboutContent);
      buildAboutIntro(aboutElements.intro, aboutContent);
    });

    initSectionContent(photoElements, () => {
      buildPhotoSection(photoElements, photoContent);
    });

    initSectionContent(featuredElements, () => {
      buildFeaturedStage(featuredElements.stage, featuredContent);
      setNodeText(featuredElements.title, featuredContent.title || "");
      setNodeText(featuredElements.titleLink, featuredContent.cards?.[0]?.title || "");
      setNodeHref(featuredElements.titleLink, featuredContent.cards?.[0]?.href || "#portfolio");
      setNodeText(featuredElements.prevButton, featuredContent.prevLabel || "");
      setNodeText(featuredElements.nextButton, featuredContent.nextLabel || "");
      setNodeAttr(
        featuredElements.prevButton,
        "aria-label",
        featuredContent.prevLabel || "Previous slide"
      );
      setNodeAttr(
        featuredElements.nextButton,
        "aria-label",
        featuredContent.nextLabel || "Next slide"
      );
    });

    initSectionContent(footerElements, () => {
      buildFooterSection(footerElements, footerContent);
    });
  }

  registerSiteModule("initSiteContentModule", initSiteContentModule);
})();
