(function registerPhotoRevealModule() {
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

  function initPhotoReveal(options = {}) {
    const {
      photoRevealConfig = {},
      siteUtils = {
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
      },
    } = options;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const initSinglePhotoSection = (photoSection) => {
      const photoImagesWrap = queryElement(".photo-images", photoSection);
      const frontPhotoImage = queryElement(".photo-image-front", photoSection);
      const photoLinkHref = photoImagesWrap?.dataset.href || "";
      const photoLinkLabel = photoImagesWrap?.dataset.linkLabel || "查看项目";

      if (!photoSection || !photoImagesWrap || !frontPhotoImage || prefersReducedMotion) {
        return;
      }
      if (photoImagesWrap.dataset.photoRevealReady === "true") return;
      photoImagesWrap.dataset.photoRevealReady = "true";

      let revealRafId = null;
      let resizeTimer = null;
      let hoverRect = null;
      let isRevealActive = true;
      let tiltRafId = null;
      let targetRotateX = 0;
      let targetRotateY = 0;
      let cells = [];

      const gridSize = siteUtils.getNumberOption(photoRevealConfig, "gridSize", 25);
      const mobileBreakpoint = siteUtils.getNumberOption(photoRevealConfig, "mobileBreakpoint", 768);
      const tiltMax = siteUtils.getNumberOption(photoRevealConfig, "tiltMax", 12);
      const perspective = siteUtils.getNumberOption(photoRevealConfig, "perspective", 1000);
      const hoverScale = siteUtils.getNumberOption(photoRevealConfig, "hoverScale", 1.02);
      const idleScale = siteUtils.getNumberOption(photoRevealConfig, "idleScale", 1);
      const hiddenCellScale = siteUtils.getNumberOption(photoRevealConfig, "hiddenCellScale", 0.6);
      const hiddenCellTranslateY = siteUtils.getNumberOption(
        photoRevealConfig,
        "hiddenCellTranslateY",
        10
      );

      const hoverHitbox = document.createElement("div");
      hoverHitbox.className = "photo-hover-hitbox";
      if (photoLinkHref) {
        hoverHitbox.setAttribute("role", "link");
        hoverHitbox.setAttribute("tabindex", "0");
        hoverHitbox.setAttribute("aria-label", photoLinkLabel);
      }
      photoImagesWrap.parentNode.insertBefore(hoverHitbox, photoImagesWrap);
      hoverHitbox.appendChild(photoImagesWrap);

      const tiltSurface = document.createElement("div");
      tiltSurface.className = "photo-tilt-surface";
      while (photoImagesWrap.firstChild) {
        tiltSurface.appendChild(photoImagesWrap.firstChild);
      }
      photoImagesWrap.appendChild(tiltSurface);

      frontPhotoImage.style.display = "none";

      const gridContainer = document.createElement("div");
      gridContainer.className = "photo-grid-container";
      tiltSurface.appendChild(gridContainer);

      const frontImageUrl = frontPhotoImage.src;

      const buildRevealGrid = () => {
        const wrapWidth = photoImagesWrap.offsetWidth || 300;
        const wrapHeight = photoImagesWrap.offsetHeight || 400;
        const cols = Math.ceil(wrapWidth / gridSize);
        const rows = Math.ceil(wrapHeight / gridSize);
        const fragment = document.createDocumentFragment();
        const nextCells = [];

        gridContainer.innerHTML = "";

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const cell = document.createElement("div");
            cell.className = "grid-cell";
            cell.style.left = `${col * gridSize}px`;
            cell.style.top = `${row * gridSize}px`;
            cell.style.width = `${gridSize}px`;
            cell.style.height = `${gridSize}px`;
            cell.style.backgroundImage = `url(${frontImageUrl})`;
            cell.style.backgroundSize = `${wrapWidth}px ${wrapHeight}px`;
            cell.style.backgroundPosition = `-${col * gridSize}px -${row * gridSize}px`;
            cell.dataset.row = String(row);
            cell.dataset.col = String(col);
            cell.dataset.delay = (
              (row + col * 0.1) / rows +
              Math.sin(col * 0.5) * 0.1 +
              Math.sin((row + 1) * (col + 3) * 0.61) * 0.05
            ).toFixed(4);
            fragment.appendChild(cell);
            nextCells.push(cell);
          }
        }

        gridContainer.appendChild(fragment);
        cells = nextCells;
      };

      const renderPhotoReveal = () => {
        const rect = photoSection.getBoundingClientRect();
        const vh = window.innerHeight;
        const start =
          vh * siteUtils.getNumberOption(photoRevealConfig, "revealStartViewportRatio", 0.72);
        const end =
          vh * siteUtils.getNumberOption(photoRevealConfig, "revealEndViewportRatio", -0.18);
        const progressRaw = (start - rect.top) / (start - end);
        const progress = Math.max(0, Math.min(1, progressRaw));
        const easedProgress = Math.pow(
          progress,
          siteUtils.getNumberOption(photoRevealConfig, "revealEasePower", 2.6)
        );

        cells.forEach((cell) => {
          const adjustedProgress = parseFloat(cell.dataset.delay || "0");

          if (easedProgress > adjustedProgress) {
            cell.style.opacity = "0";
            cell.style.transform = `scale(${hiddenCellScale}) translateY(${hiddenCellTranslateY}px)`;
            return;
          }

          cell.style.opacity = "1";
          cell.style.transform = "scale(1) translateY(0)";
        });

        revealRafId = null;
      };

      const requestPhotoReveal = () => {
        if (!isRevealActive || revealRafId) return;
        revealRafId = requestAnimationFrame(renderPhotoReveal);
      };

      const updateTransform = () => {
        const isIdle = targetRotateX === 0 && targetRotateY === 0;
        const scale = isIdle ? idleScale : hoverScale;
        photoImagesWrap.style.transform =
          `perspective(${perspective}px) rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg) scale3d(${scale}, ${scale}, 1)`;
        tiltRafId = null;
      };

      const resetPhotoTilt = () => {
        targetRotateX = 0;
        targetRotateY = 0;
        if (!tiltRafId) {
          tiltRafId = requestAnimationFrame(updateTransform);
        }
      };

      const handleMouseMove = (event) => {
        const rect = hoverRect || hoverHitbox.getBoundingClientRect();
        const edgeInset =
          window.innerWidth <= mobileBreakpoint
            ? siteUtils.getNumberOption(photoRevealConfig, "mobileEdgeInset", 14)
            : siteUtils.getNumberOption(photoRevealConfig, "desktopEdgeInset", 14);
        const isInsideStableHoverZone =
          event.clientX >= rect.left + edgeInset &&
          event.clientX <= rect.right - edgeInset &&
          event.clientY >= rect.top + edgeInset &&
          event.clientY <= rect.bottom - edgeInset;

        if (!isInsideStableHoverZone) {
          resetPhotoTilt();
          return;
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        targetRotateX = Math.max(
          -tiltMax,
          Math.min(tiltMax, ((event.clientY - centerY) / (rect.height / 2)) * -tiltMax)
        );
        targetRotateY = Math.max(
          -tiltMax,
          Math.min(tiltMax, ((event.clientX - centerX) / (rect.width / 2)) * tiltMax)
        );

        if (!tiltRafId) {
          tiltRafId = requestAnimationFrame(updateTransform);
        }
      };

      buildRevealGrid();
      requestPhotoReveal();

      window.addEventListener("scroll", requestPhotoReveal, { passive: true });
      window.addEventListener("resize", requestPhotoReveal);
      window.addEventListener("resize", () => {
        if (resizeTimer) {
          window.clearTimeout(resizeTimer);
        }
        resizeTimer = window.setTimeout(() => {
          buildRevealGrid();
          requestPhotoReveal();
        }, 90);
      });

      if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            isRevealActive = Boolean(entry?.isIntersecting);
            if (isRevealActive) {
              requestPhotoReveal();
            }
          },
          {
            root: null,
            rootMargin: "30% 0px 30% 0px",
            threshold: 0,
          }
        );
        revealObserver.observe(photoSection);
      }

      hoverHitbox.addEventListener("pointerenter", () => {
        hoverRect = hoverHitbox.getBoundingClientRect();
      });
      hoverHitbox.addEventListener("mousemove", handleMouseMove);
      hoverHitbox.addEventListener("mouseleave", () => {
        hoverRect = null;
        resetPhotoTilt();
      });

      if (photoLinkHref) {
        const openPhotoLink = () => {
          window.location.assign(photoLinkHref);
        };

        hoverHitbox.addEventListener("click", (event) => {
          event.preventDefault();
          openPhotoLink();
        });

        hoverHitbox.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          openPhotoLink();
        });
      }
    };

    const photoSections = document.querySelectorAll(".section-three");
    photoSections.forEach(initSinglePhotoSection);
  }

  registerSiteModule("initPhotoRevealModule", initPhotoReveal);
})();
