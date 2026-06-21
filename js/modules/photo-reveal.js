(function registerPhotoRevealModule() {
  function initPhotoReveal(options = {}) {
    const {
      photoRevealConfig = {},
      siteUtils = {
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
      },
    } = options;
    const photoSection = document.querySelector("#photo");
    const photoImagesWrap = document.querySelector("#photo .photo-images");
    const frontPhotoImage = document.querySelector("#photo .photo-image-front");
    const photoLinkHref = photoImagesWrap?.dataset.href || "";
    const photoLinkLabel = photoImagesWrap?.dataset.linkLabel || "查看项目";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (photoSection && photoImagesWrap && frontPhotoImage && !prefersReducedMotion) {
      if (photoImagesWrap.dataset.photoRevealReady === "true") return;
      photoImagesWrap.dataset.photoRevealReady = "true";
      let revealRafId = null;
      let hoverRect = null;
      let isRevealActive = true;
      const gridSize = siteUtils.getNumberOption(photoRevealConfig, "gridSize", 25);
      const mobileBreakpoint = siteUtils.getNumberOption(photoRevealConfig, "mobileBreakpoint", 768);
      const tiltMax = siteUtils.getNumberOption(photoRevealConfig, "tiltMax", 12);
      const perspective = siteUtils.getNumberOption(photoRevealConfig, "perspective", 1000);
      const hoverScale = siteUtils.getNumberOption(photoRevealConfig, "hoverScale", 1.02);
      const idleScale = siteUtils.getNumberOption(photoRevealConfig, "idleScale", 1);

      const hoverHitbox = document.createElement('div');
      hoverHitbox.className = 'photo-hover-hitbox';
      if (photoLinkHref) {
        hoverHitbox.setAttribute("role", "link");
        hoverHitbox.setAttribute("tabindex", "0");
        hoverHitbox.setAttribute("aria-label", photoLinkLabel);
      }
      photoImagesWrap.parentNode.insertBefore(hoverHitbox, photoImagesWrap);
      hoverHitbox.appendChild(photoImagesWrap);

      const tiltSurface = document.createElement('div');
      tiltSurface.className = 'photo-tilt-surface';
      while (photoImagesWrap.firstChild) {
        tiltSurface.appendChild(photoImagesWrap.firstChild);
      }
      photoImagesWrap.appendChild(tiltSurface);

      // 隐藏原始的上层图片，用方块格子代替
      frontPhotoImage.style.display = 'none';

      // 创建方块格子容器
      const gridContainer = document.createElement('div');
      gridContainer.className = 'photo-grid-container';
      tiltSurface.appendChild(gridContainer);

      // 获取上层图片的 URL
      const frontImageUrl = frontPhotoImage.src;

      // 生成方块格子
      const wrapWidth = photoImagesWrap.offsetWidth || 300;
      const wrapHeight = photoImagesWrap.offsetHeight || 400;
      const cols = Math.ceil(wrapWidth / gridSize);
      const rows = Math.ceil(wrapHeight / gridSize);
      const cells = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cell = document.createElement('div');
          cell.className = 'grid-cell';
          cell.style.left = `${col * gridSize}px`;
          cell.style.top = `${row * gridSize}px`;
          cell.style.width = `${gridSize}px`;
          cell.style.height = `${gridSize}px`;
          cell.style.backgroundImage = `url(${frontImageUrl})`;
          cell.style.backgroundSize = `${wrapWidth}px ${wrapHeight}px`;
          cell.style.backgroundPosition = `-${col * gridSize}px -${row * gridSize}px`;
          cell.dataset.row = row;
          cell.dataset.col = col;
          cell.dataset.delay = (
            (row + col * 0.1) / rows +
            Math.sin(col * 0.5) * 0.1 +
            Math.sin((row + 1) * (col + 3) * 0.61) * 0.05
          ).toFixed(4);
          gridContainer.appendChild(cell);
          cells.push(cell);
        }
      }

      // 根据滚动进度实现方块格子消散效果
      const renderPhotoReveal = () => {
        const rect = photoSection.getBoundingClientRect();
        const vh = window.innerHeight;
        const start = vh * siteUtils.getNumberOption(photoRevealConfig, "revealStartViewportRatio", 0.72);
        const end = vh * siteUtils.getNumberOption(photoRevealConfig, "revealEndViewportRatio", -0.18);
        const progressRaw = (start - rect.top) / (start - end);
        const progress = Math.max(0, Math.min(1, progressRaw));
        const easedProgress = Math.pow(
          progress,
          siteUtils.getNumberOption(photoRevealConfig, "revealEasePower", 2.6)
        );

        cells.forEach(cell => {
          const adjustedProgress = parseFloat(cell.dataset.delay || "0");

          if (easedProgress > adjustedProgress) {
            cell.style.opacity = 0;
            cell.style.transform =
              `scale(${siteUtils.getNumberOption(photoRevealConfig, "hiddenCellScale", 0.6)}) translateY(${siteUtils.getNumberOption(photoRevealConfig, "hiddenCellTranslateY", 10)}px)`;
          } else {
            cell.style.opacity = 1;
            cell.style.transform = 'scale(1) translateY(0)';
          }
        });

        revealRafId = null;
      };

      // 用 rAF 合并 scroll/resize，避免同一帧内重复计算
      const requestPhotoReveal = () => {
        if (!isRevealActive) return;
        if (revealRafId) return;
        revealRafId = requestAnimationFrame(renderPhotoReveal);
      };

      requestPhotoReveal();
      window.addEventListener("scroll", requestPhotoReveal, { passive: true });
      window.addEventListener("resize", requestPhotoReveal);

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

      // 鼠标跟随 3D 效果
      let rafId = null;
      let targetRotateX = 0;
      let targetRotateY = 0;

      const updateTransform = () => {
        const isIdle = targetRotateX === 0 && targetRotateY === 0;
        const scale = isIdle ? idleScale : hoverScale;
        photoImagesWrap.style.transform =
          `perspective(${perspective}px) rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg) scale3d(${scale}, ${scale}, 1)`;
        rafId = null;
      };

      const resetPhotoTilt = () => {
        targetRotateX = 0;
        targetRotateY = 0;
        if (!rafId) {
          rafId = requestAnimationFrame(updateTransform);
        }
      };

      const handleMouseMove = (e) => {
        const rect = hoverRect || hoverHitbox.getBoundingClientRect();
        const edgeInset = window.innerWidth <= mobileBreakpoint
          ? siteUtils.getNumberOption(photoRevealConfig, "mobileEdgeInset", 14)
          : siteUtils.getNumberOption(photoRevealConfig, "desktopEdgeInset", 14);
        const isInsideStableHoverZone =
          e.clientX >= rect.left + edgeInset &&
          e.clientX <= rect.right - edgeInset &&
          e.clientY >= rect.top + edgeInset &&
          e.clientY <= rect.bottom - edgeInset;

        if (!isInsideStableHoverZone) {
          resetPhotoTilt();
          return;
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        targetRotateX = Math.max(
          -tiltMax,
          Math.min(tiltMax, ((e.clientY - centerY) / (rect.height / 2)) * -tiltMax)
        );
        targetRotateY = Math.max(
          -tiltMax,
          Math.min(tiltMax, ((e.clientX - centerX) / (rect.width / 2)) * tiltMax)
        );

        if (!rafId) {
          rafId = requestAnimationFrame(updateTransform);
        }
      };

      hoverHitbox.addEventListener("pointerenter", () => {
        hoverRect = hoverHitbox.getBoundingClientRect();
      });
      hoverHitbox.addEventListener('mousemove', handleMouseMove);
      hoverHitbox.addEventListener('mouseleave', () => {
        hoverRect = null;
        resetPhotoTilt();
      });

      if (photoLinkHref) {
        const openPhotoLink = () => {
          window.location.href = photoLinkHref;
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
    }
  }

  if (!window.__siteModules) window.__siteModules = {};
  window.__siteModules.initPhotoRevealModule = initPhotoReveal;
})();
