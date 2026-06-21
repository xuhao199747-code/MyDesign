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

    // React bounce cards section mount config.
    portfolioBounceCards: {
      cardSlugs: ["profile", "sneakers", "about", "portrait"],
      animationDelay: 0.15,
      animationStagger: 0.08,
      easeType: "elastic.out(1, 0.5)",
      desktopTransformStyles: [
        "rotate(5deg) translate(-340px)",
        "rotate(-4deg) translate(-115px)",
        "rotate(4deg) translate(115px)",
        "rotate(-5deg) translate(340px)",
      ],
      mobileTransformStyles: [
        "rotate(5deg) translate(-104px)",
        "rotate(-4deg) translate(-34px)",
        "rotate(4deg) translate(34px)",
        "rotate(-5deg) translate(104px)",
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
      criticalResources: [
        "./imag/frame_front.webp",
        "./imag/sprite.webp",
        "./imag/sprite_2.webp",
        "./imag/sprite_3.webp",
        "./imag/sprite_4.webp",
      ],
      nonCriticalResources: [
        "./imag/photo1.png",
        "./imag/photo2.png",
        "./imag/portfolio-cards1.webp",
        "./imag/Frame 2085668692.png",
        "./imag/Group 1940698323.png",
        "./imag/Bottom information.png",
        "./imag/Image2.webp",
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
        "./font/ArchivoBlack-Regular.ttf",
        "./font/LuckiestGuy-Regular.ttf",
      ],
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
      desktopEdgePadding: 10,
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
        ".photo-top",
        ".portfolio-top",
        ".portfolio-featured__head h2",
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
