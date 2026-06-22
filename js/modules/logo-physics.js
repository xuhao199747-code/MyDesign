(function registerLogoPhysicsModule() {
  const siteRuntime = window.__siteRuntime || {};
  const siteSections = window.__siteSections || {};
  const queryElement =
    siteRuntime.queryElement || ((selector, root = document) => root.querySelector(selector));
  const registerSiteModule =
    siteRuntime.registerSiteModule ||
    ((moduleName, initModule) => {
      if (!window.__siteModules) window.__siteModules = {};
      window.__siteModules[moduleName] = initModule;
    });

  function initLogoPhysicsModule(options = {}) {
    const {
      logoPhysicsConfig = {},
      siteHelpers = {
        getMeasuredBoxSize() {
          return 64;
        },
        resolveParticleCollisions() {},
      },
      siteUtils = {
        clamp(value) {
          return value;
        },
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
        randomInRange(min, max) {
          return (min + max) / 2;
        },
      },
    } = options;

    const aboutElements = siteSections.getHomeSectionElements?.().about || {};
    const logoWall = aboutElements.logoWall || queryElement(".logo-wall");
    if (!logoWall) return;
    if (logoWall.dataset.logoPhysicsReady === "true") return;
    logoWall.dataset.logoPhysicsReady = "true";

    let physicsStarted = false;
    let physicsRafId = null;
    let logoParticles = [];

    const getLogoSize = () => {
      const fallbackSize = siteUtils.getNumberOption(
        logoPhysicsConfig,
        "sizeFallback",
        64
      );
      return siteHelpers.getMeasuredBoxSize(logoWall, "img", fallbackSize);
    };

    const resolveLogoCollisions = (particles, size) => {
      siteHelpers.resolveParticleCollisions(particles, size, {
        minDistRatio: 0.86,
        restitution: 0.32,
      });
    };

    const setupLogoParticles = () => {
      const logos = Array.from(logoWall.querySelectorAll("img"));
      if (!logos.length) {
        logoParticles = [];
        return;
      }

      const wallWidth = logoWall.clientWidth;
      const wallHeight = logoWall.clientHeight;
      const mobileBreakpoint = siteUtils.getNumberOption(
        logoPhysicsConfig,
        "mobileBreakpoint",
        768
      );
      const isMobile = window.innerWidth <= mobileBreakpoint;
      const size = getLogoSize();
      const edgeSafe = isMobile
        ? siteUtils.getNumberOption(logoPhysicsConfig, "edgeSafeMobile", 6)
        : siteUtils.getNumberOption(logoPhysicsConfig, "edgeSafeDesktop", 14);
      const floorSafe = isMobile
        ? siteUtils.getNumberOption(logoPhysicsConfig, "floorSafeMobile", 20)
        : siteUtils.getNumberOption(logoPhysicsConfig, "floorSafeDesktop", 44);
      const usableWidth = wallWidth - size - edgeSafe * 2;
      const step = usableWidth / Math.max(logos.length - 1, 1);
      const baseGround = wallHeight - size - floorSafe;

      logoParticles = logos.map((el, index) => {
        const jitter = isMobile
          ? siteUtils.randomInRange(-11, 11)
          : siteUtils.randomInRange(-18, 18);
        const x = siteUtils.clamp(
          edgeSafe + index * step + jitter,
          edgeSafe,
          wallWidth - size - edgeSafe
        );
        const angle = siteUtils.randomInRange(-26, 26);
        const startY = isMobile
          ? -Math.min(
              siteUtils.getNumberOption(logoPhysicsConfig, "startYMobileMax", 240),
              wallHeight *
                siteUtils.getNumberOption(logoPhysicsConfig, "startYMobileFactor", 0.72)
            ) - siteUtils.randomInRange(0, 56)
          : -siteUtils.getNumberOption(logoPhysicsConfig, "startYDesktopBase", 280) -
            siteUtils.randomInRange(0, 120);

        el.style.opacity = "0";
        el.style.transform = `translate3d(${x}px, ${startY}px, 0) rotate(${angle}deg)`;

        return {
          el,
          x,
          y: startY,
          vx: siteUtils.randomInRange(-20, 20),
          vy: siteUtils.randomInRange(0, 20),
          angle,
          av: siteUtils.randomInRange(-120, 120),
          ground: baseGround,
          delay: siteUtils.randomInRange(0, 0.75),
          active: false,
          settled: false,
        };
      });
    };

    const startLogoPhysics = () => {
      if (physicsStarted || !logoParticles.length) return;
      physicsStarted = true;

      const mobileBreakpoint = siteUtils.getNumberOption(
        logoPhysicsConfig,
        "mobileBreakpoint",
        768
      );
      const isMobile = window.innerWidth <= mobileBreakpoint;
      const gravity = isMobile
        ? siteUtils.getNumberOption(logoPhysicsConfig, "gravityMobile", 1800)
        : siteUtils.getNumberOption(logoPhysicsConfig, "gravityDesktop", 2100);
      const bounce = isMobile
        ? siteUtils.getNumberOption(logoPhysicsConfig, "bounceMobile", 0.34)
        : siteUtils.getNumberOption(logoPhysicsConfig, "bounceDesktop", 0.38);
      const drag = siteUtils.getNumberOption(logoPhysicsConfig, "drag", 0.996);
      const sideDamp = siteUtils.getNumberOption(logoPhysicsConfig, "sideDamp", 0.55);
      const rotationDamp = siteUtils.getNumberOption(logoPhysicsConfig, "rotationDamp", 0.88);
      const wallWidth = logoWall.clientWidth;
      const size = getLogoSize();
      const edgeSafe = isMobile
        ? siteUtils.getNumberOption(logoPhysicsConfig, "edgeSafeMobile", 6)
        : siteUtils.getNumberOption(logoPhysicsConfig, "edgeSafeDesktop", 14);
      const floorSafe = isMobile
        ? siteUtils.getNumberOption(logoPhysicsConfig, "floorSafeMobile", 20)
        : siteUtils.getNumberOption(logoPhysicsConfig, "floorSafeDesktop", 44);
      const floorY = logoWall.clientHeight - size - floorSafe;
      let elapsed = 0;
      let lastTs = 0;

      const tick = (ts) => {
        if (!lastTs) lastTs = ts;
        const dt = Math.min(0.033, (ts - lastTs) / 1000);
        lastTs = ts;
        elapsed += dt;

        let allSettled = true;

        logoParticles.forEach((particle) => {
          if (!particle.active && elapsed >= particle.delay) {
            particle.active = true;
            particle.el.style.opacity = "1";
          }

          if (!particle.active) {
            allSettled = false;
            return;
          }

          if (particle.settled) {
            return;
          }

          particle.vy += gravity * dt;
          particle.vx *= drag;
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          particle.angle += particle.av * dt;

          if (particle.x < edgeSafe) {
            particle.x = edgeSafe;
            particle.vx *= -sideDamp;
          } else if (particle.x > wallWidth - size - edgeSafe) {
            particle.x = wallWidth - size - edgeSafe;
            particle.vx *= -sideDamp;
          }

          if (particle.y >= particle.ground) {
            particle.y = particle.ground;
            particle.vy *= -bounce;
            particle.vx *= 0.9;
            particle.av *= rotationDamp;

            if (Math.abs(particle.vy) < 24) {
              particle.vy = 0;
              particle.av *= 0.7;
            }
          }

          if (
            Math.abs(particle.vx) < 3 &&
            Math.abs(particle.vy) < 3 &&
            Math.abs(particle.y - particle.ground) < 0.5
          ) {
            particle.vx = 0;
            particle.vy = 0;
            particle.av = 0;
            particle.y = particle.ground;
            particle.settled = true;
          } else {
            allSettled = false;
          }

          particle.el.style.transform =
            `translate3d(${particle.x}px, ${particle.y}px, 0) rotate(${particle.angle.toFixed(2)}deg)`;
        });

        resolveLogoCollisions(logoParticles, size);
        resolveLogoCollisions(logoParticles, size);

        logoParticles.forEach((particle) => {
          if (!particle.active) return;
          if (particle.x < edgeSafe) particle.x = edgeSafe;
          if (particle.x > wallWidth - size - edgeSafe) {
            particle.x = wallWidth - size - edgeSafe;
          }
          if (particle.y > floorY) particle.y = floorY;

          particle.el.style.transform =
            `translate3d(${particle.x}px, ${particle.y}px, 0) rotate(${particle.angle.toFixed(2)}deg)`;
        });

        if (!allSettled) {
          physicsRafId = requestAnimationFrame(tick);
        } else {
          physicsRafId = null;
        }
      };

      physicsRafId = requestAnimationFrame(tick);

      window.setTimeout(() => {
        logoParticles.forEach((particle) => {
          if (!particle.settled) particle.el.style.opacity = "1";
        });
      }, 120);
    };

    setupLogoParticles();

    const restartLogoPhysics = () => {
      if (physicsRafId) {
        cancelAnimationFrame(physicsRafId);
        physicsRafId = null;
      }
      physicsStarted = false;
      setupLogoParticles();
      startLogoPhysics();
    };

    let hasPlayedInCurrentViewport = false;
    let hasPlayedOnceOnMobile = false;
    let isAnimating = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isMobileViewport = window.innerWidth <= 768;
          if (!entry.isIntersecting) return;
          if (isAnimating) return;

          if (isMobileViewport) {
            if (hasPlayedOnceOnMobile) return;
            hasPlayedOnceOnMobile = true;
            isAnimating = true;
            restartLogoPhysics();
            return;
          }

          if (!hasPlayedInCurrentViewport) {
            hasPlayedInCurrentViewport = true;
            isAnimating = true;
            restartLogoPhysics();
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(logoWall);

    let resizeTimer;
    let lastViewportWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const currentWidth = window.innerWidth;
        const widthChanged = Math.abs(currentWidth - lastViewportWidth) > 8;
        lastViewportWidth = currentWidth;
        if (!widthChanged) return;

        hasPlayedInCurrentViewport = false;
        isAnimating = false;
        restartLogoPhysics();
      }, 160);
    });
  }

  registerSiteModule("initLogoPhysicsModule", initLogoPhysicsModule);
})();
