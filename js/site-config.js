(function registerSiteConfig() {
  const deepFreeze = (value) => {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }

    Object.getOwnPropertyNames(value).forEach((key) => {
      deepFreeze(value[key]);
    });

    return Object.freeze(value);
  };

  const projectCatalog = [
    {
      slug: "profile",
      title: "Profile",
      category: "VIBE CODING",
      image: "./imag/photo1.png",
      summary: "个人展示页与信息架构整理，聚焦视觉表达、身份识别和内容层级。",
      description:
        "这个项目围绕个人主页的视觉呈现展开，重点优化了首屏识别、内容编排和品牌语气，让用户在短时间内理解角色定位与作品方向。",
      tags: ["Brand", "Portfolio", "UI"],
    },
    {
      slug: "sneakers",
      title: "Sneakers",
      category: "MY DESIGN",
      image: "./imag/portfolio-cards1.webp",
      summary: "电商鞋服专题页，强调卡片节奏、醒目标识与产品转化链路。",
      description:
        "Sneakers 项目聚焦产品信息与活动视觉的组合表达，通过高反差主视觉、卡片式陈列和明确的行动路径，提高了浏览效率与转化感知。",
      tags: ["E-commerce", "Campaign", "Visual"],
    },
    {
      slug: "about",
      title: "About",
      category: "MY DESIGN",
      image: "./imag/Image2.webp",
      summary: "关于页与介绍型版面的系统整理，统一语气、图文关系和阅读节奏。",
      description:
        "About 项目主要处理品牌自我介绍和方法论表达，目标是把信息从“堆叠”变成“叙述”，让版面更有结构，也更有可信度。",
      tags: ["Content", "Storytelling", "Layout"],
    },
    {
      slug: "portrait",
      title: "Portrait",
      category: "VIBE CODING",
      image: "./imag/photo2.png",
      summary: "视觉实验型人物展示页，强调图像裁切、氛围塑造和轻交互反馈。",
      description:
        "Portrait 项目通过人物影像和轻量动效的组合强化氛围表达，在不打断阅读的前提下增加页面记忆点，适合用于品牌或设计展示场景。",
      tags: ["Art Direction", "Motion", "Showcase"],
    },
  ];

  const logoItems = [
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
  ];

  const heroCriticalResources = [
    "./imag/frame_front.webp",
    "./imag/sprite.webp",
    "./imag/sprite_2.webp",
    "./imag/sprite_3.webp",
    "./imag/sprite_4.webp",
  ];

  const sharedImageResources = [
    ...new Set([
      ...projectCatalog.map((item) => item.image).filter(Boolean),
      "./imag/Frame 2085668692.png",
      "./imag/Group 1940698323.png",
      ...logoItems,
    ]),
  ];

  const sharedFontResources = [
    "./font/ArchivoBlack-Regular.ttf",
    "./font/LuckiestGuy-Regular.ttf",
  ];

  const siteConfig = {

    // Boot and diagnostics.
    boot: {
      continueOnError: true,
      exposeStatus: true,
      emitEvents: true,
      logSummary: false,
    },

    // Shared shell/navigation behavior.
    shell: {
      navbarScrollThreshold: 40,
      anchorOffset: 72,
      mobileMenuOutsideClose: true,
    },

    // Shared navbar defaults for detail pages and isolated shells.
    navbar: {
      mobileBreakpoint: 768,
      scrollThreshold: 8,
      closeOnHashChange: true,
      syncOnPageShow: true,
    },

    // Project detail page rendering defaults.
    projectDetail: {
      documentTitleSuffix: "XUHAO DESIGN",
      closeOnHashChange: false,
    },

    // Shared project catalog for homepage modules and detail pages.
    projectCatalog,

    // React menu icon mount config.
    menuIcon: {
      size: 24,
      duration: 1,
      color: "#0f172a",
    },

    // React cursor ring behavior config.
    cursorRing: {
      followEase: 0.22,
      assistantBlockSelectors:
        "#chatWidgetRoot, .site-assistant__panel, .site-assistant__trigger",
      interactiveSelectors:
        "a, button, input, textarea, select, label, [role='button'], .photo-hover-hitbox, .bounceCardsContainer .card, .portfolio-featured__cell",
    },

    // React bounce cards section mount config.
    portfolioBounceCards: {
      cardSlugs: ["profile", "sneakers", "about", "portrait"],
      animationDelay: 0.15,
      animationStagger: 0.08,
      easeType: "elastic.out(1, 0.5)",
      desktopTransformStyles: [
        "rotate(5deg) translate(calc(var(--bounce-card-size) * -0.8))",
        "rotate(-4deg) translate(calc(var(--bounce-card-size) * -0.27))",
        "rotate(4deg) translate(calc(var(--bounce-card-size) * 0.27))",
        "rotate(-5deg) translate(calc(var(--bounce-card-size) * 0.8))",
      ],
      mobileTransformStyles: [
        "rotate(5deg) translate(calc(var(--bounce-card-size) * -0.86))",
        "rotate(-4deg) translate(calc(var(--bounce-card-size) * -0.3))",
        "rotate(4deg) translate(calc(var(--bounce-card-size) * 0.3))",
        "rotate(-5deg) translate(calc(var(--bounce-card-size) * 0.86))",
      ],
      enableHover: true,
    },

    // Floating assistant entry config.
    assistantWidget: {
      title: "Site Assistant",
      subtitle: "Bottom-right modal",
      triggerLabel: "Chat",
      closeLabel: "Close assistant",
      inputPlaceholder: "Safe mode first, AI next",
      submitLabel: "Send",
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          text: "Assistant entry is back. Safe mode stays on first so the page layout remains stable.",
        },
      ],
      safeReply:
        "Safe mode is active for now. Real AI and Elements will be wired back in after the page is stable.",
    },

    // Preload timing and asset lists.
    preloader: {
      criticalResources: heroCriticalResources,
      nonCriticalResources: [...sharedImageResources, ...sharedFontResources],
      phrases: [
        "Please wait a moment.",
        "Loading the full experience.",
      ],
      hideDelayMs: 600,
      minimumDisplayMs: 900,
      maxDisplayMs: 7000,
      typePauseMs: 900,
      typeNextPhraseDelayMs: 220,
      typeForwardMs: 42,
      typeBackwardMs: 24,
    },

    // Photo card reveal and tilt interaction.
    photoReveal: {
      gridSize: 25,
      revealStartViewportRatio: 0.72,
      revealEndViewportRatio: -0.18,
      revealEasePower: 2.6,
      mobileBreakpoint: 768,
      mobileEdgeInset: 14,
      desktopEdgeInset: 14,
      tiltMax: 12,
      perspective: 1000,
      hoverScale: 1.02,
      idleScale: 1,
      hiddenCellScale: 0.6,
      hiddenCellTranslateY: 10,
    },

    // Static copy for homepage content blocks.
    homeContent: {
      about: {
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
      featured: {
        title: "MY DESIGN",
        prevLabel: "上一张",
        nextLabel: "下一张",
        cardSlugs: ["sneakers", "profile", "about"],
      },
    },

    // Clean template data for homepage sections.
    homeTemplates: {
      about: {
        logoAltPrefix: "工具图标",
        logoItems,
      },
    },

    // Hero sprite tracking.
    headTracker: {
      frameCount: 240,
      frameCols: 12,
      framesPerSheet: 60,
      frameWidth: 1280,
      frameHeight: 720,
      frontFrame: 0,
      centerDeadZone: 54,
      lookCenterX: 0.5,
      lookCenterY: 0.56,
      spriteSrcs: [
        "./imag/sprite.webp",
        "./imag/sprite_2.webp",
        "./imag/sprite_3.webp",
        "./imag/sprite_4.webp",
      ],
      angleKeys: [
        { angle: 0, frame: 60, direction: "right", videoFrame: 150 },
        { angle: 45, frame: 75, direction: "right-down", videoFrame: 187 },
        { angle: 90, frame: 94, direction: "down", videoFrame: 237 },
        { angle: 135, frame: 114, direction: "left-down", videoFrame: 287 },
        { angle: 180, frame: 135, direction: "left", videoFrame: 338 },
        { angle: 225, frame: 156, direction: "left-up", videoFrame: 391 },
        { angle: 270, frame: 166, direction: "up", videoFrame: 416 },
        { angle: 315, frame: 45, direction: "right-up", videoFrame: 112 },
        { angle: 360, frame: 60, direction: "right", videoFrame: 150 },
      ],
    },

    // Hero text distortion and float motion.
    heroTextFloat: {
      fuzzRange: 21,
      baseIntensity: 0.12,
      hoverIntensity: 0.11,
      letterSpacing: 2,
      fps: 35,
      glitchMode: true,
      clickEffect: true,
      clickBoostDuration: 320,
      lerpFactor: 0.1,
      burstIntensityMin: 0.22,
      burstIntensityMax: 0.52,
      burstDurationMin: 420,
      burstIntervalMin: 500,
      burstIntervalMax: 4200,
      mobileBreakpoint: 768,
      mobileEdgePadding: 6,
      desktopEdgePadding: 34,
      mobileVerticalPadding: 8,
      desktopVerticalPadding: 10,
    },

    // Hover-follow preview in works section.
    worksSwipePreview: {
      imageOffsetX: 18,
      imageOffsetY: -12,
      captionOffsetX: 28,
      captionOffsetY: 86,
      imageDuration: 0.35,
      imageAlphaDuration: 0.28,
      captionDuration: 0.4,
      captionAlphaDuration: 0.25,
    },

    // Infinite card carousel physics.
    infiniteCards: {
      spacing: 0.085,
      overlap: 0.6,
      cardInterval: 1,
      dragFactor: 0.0015,
      wheelFactor: 0.0009,
      wheelSettleDelayMs: 120,
      loopIterationBase: 10,
      loopStartMultiplier: 5,
    },

    // Featured showcase carousel motion.
    portfolioFeatured: {
      loopCopies: 15,
      mobileBreakpoint: 768,
      initDelayFrames: 1,
      motionLoopDuration: 960,
      motionLoopStaticDuration: 120,
      motionLoopAnimatedDuration: 1180,
      resizeDebounceMs: 80,
      wheelResetDelay: 140,
      gestureActiveDuration: 700,
      horizontalGestureThreshold: 6,
      dragThreshold: 10,
      dragAxisBias: 1.12,
      mobileDragSensitivity: 0.76,
      desktopDragSensitivity: 1,
      wheelDeltaThreshold: 4,
      edgeInset: 14,
      tiltMax: 10,
      tiltScale: 1.02,
      mobileRotationStrength: 0.056,
      desktopRotationStrength: 0.042,
      mobileRotationLimit: 32,
      desktopRotationLimit: 25,
      mobileCurveBase: 10,
      desktopCurveBase: 6,
      mobileCurveStrength: 96,
      desktopCurveStrength: 66,
      mobileCurveRange: 420,
      desktopCurveRange: 560,
      mobileTransitionDuration: "0.74s",
      desktopTransitionDuration: "1.05s",
      mobileTransitionEase: "cubic-bezier(0.22, 0.98, 0.28, 1)",
      desktopTransitionEase: "cubic-bezier(0.18, 1, 0.22, 1)",
      stepFallbackMs: 1240,
    },

    // Falling logo physics section.
    logoPhysics: {
      mobileBreakpoint: 768,
      sizeFallback: 64,
      edgeSafeMobile: 6,
      edgeSafeDesktop: 14,
      floorSafeMobile: 20,
      floorSafeDesktop: 44,
      gravityMobile: 1800,
      gravityDesktop: 2100,
      bounceMobile: 0.34,
      bounceDesktop: 0.38,
      drag: 0.996,
      sideDamp: 0.55,
      rotationDamp: 0.88,
      startYMobileMax: 240,
      startYMobileFactor: 0.72,
      startYDesktopBase: 280,
    },

    // Decorative title treatment.
    playfulTitle: {
      selectors: [
        '[data-section-node="photo-title"]',
        '[data-section-node="portfolio-title"]',
        '[data-section-node="featured-title"]',
      ],
      rotatePattern: [-5, 4, -2, 5, -4, 3],
      assets: {
        workFace: "./imag/Group 1940699207.png",
        lightBulb: "./imag/灯泡 1.png",
        designFire: "./imag/Group 1940699208.png",
      },
    },

    // Global click burst feedback.
    clickSurprise: {
      assistantSelector: "#chatWidgetRoot, .site-assistant__panel, .site-assistant__trigger",
      selectionLockDuration: 520,
      burstTopOffset: 28,
      bubbleDelayMs: 58,
      bubbleBaseY: 58,
      bubbleRandomY: 24,
      bubbleBaseX: 10,
      bubbleRandomX: 20,
      bubbleRotateRange: 8,
      stickerSpreadBase: 28,
      stickerSpreadRandom: 42,
      stickerStartXRange: 22,
      stickerStartYRange: 14,
      stickerLiftBase: 24,
      stickerLiftRandom: 28,
      stickerRotateBase: 26,
      stickerRotateRandom: 52,
      stickerDelayStepMs: 28,
      angleSpreadRatio: 0.94,
      stickerSets: [
        ["✨", "💫", "⭐", "🌈", "🎉"],
        ["💥", "🎈", "💖", "🍀", "⚡"],
        ["🌟", "🎨", "🎊", "🧠", "🫶"],
        ["🪐", "🌙", "🔥", "🎁", "🫧"],
      ],
      messages: [
        "哇，你变帅了！",
        "好事正在发生",
        "今天也灵感满格",
        "灵感捕获成功",
        "脑洞正在偷偷加载",
        "这一下点中了快乐",
        "今日份惊喜已签收",
        "好运正在向你靠近",
        "创意雷达滴滴作响",
        "你的想法有点会发光",
      ],
    },
  };

  deepFreeze(siteConfig);

  const getSiteConfigSection = (sectionName) => siteConfig[sectionName];

  globalThis.__siteConfig = siteConfig;
  globalThis.__getSiteConfigSection = getSiteConfigSection;
  if (typeof window !== "undefined") {
    window.__siteConfig = siteConfig;
    window.__getSiteConfigSection = getSiteConfigSection;
  }
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.dataset.siteConfig = "ready";
  }
})();
