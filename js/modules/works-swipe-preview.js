(function registerWorksSwipePreviewModule() {
  function initWorksSwipePreview(options = {}) {
    if (typeof gsap === "undefined") return;
    const {
      worksSwipePreviewConfig = {},
      siteUtils = {
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
      },
    } = options;

    const previewRoot = document.querySelector(".works-swipe-section");
    if (!previewRoot) return;
    if (previewRoot.dataset.worksPreviewReady === "true") return;

    const previewImage = previewRoot.querySelector(".works-swipe-preview__image");
    const previewCaption = previewRoot.querySelector(".works-swipe-preview__caption");
    const items = Array.from(previewRoot.querySelectorAll("[data-preview-image]"));
    if (!previewImage || !previewCaption || !items.length) return;
    previewRoot.dataset.worksPreviewReady = "true";

    const xTo = gsap.quickTo(previewImage, "x", {
      duration: siteUtils.getNumberOption(worksSwipePreviewConfig, "imageDuration", 0.35),
      ease: "power3.out",
    });
    const yTo = gsap.quickTo(previewImage, "y", {
      duration: siteUtils.getNumberOption(worksSwipePreviewConfig, "imageDuration", 0.35),
      ease: "power3.out",
    });
    const alphaTo = gsap.quickTo(previewImage, "autoAlpha", {
      duration: siteUtils.getNumberOption(worksSwipePreviewConfig, "imageAlphaDuration", 0.28),
      ease: "power2.out",
    });

    const captionXTo = gsap.quickTo(previewCaption, "x", {
      duration: siteUtils.getNumberOption(worksSwipePreviewConfig, "captionDuration", 0.4),
      ease: "power3.out",
    });
    const captionYTo = gsap.quickTo(previewCaption, "y", {
      duration: siteUtils.getNumberOption(worksSwipePreviewConfig, "captionDuration", 0.4),
      ease: "power3.out",
    });
    const captionAlphaTo = gsap.quickTo(previewCaption, "autoAlpha", {
      duration: siteUtils.getNumberOption(worksSwipePreviewConfig, "captionAlphaDuration", 0.25),
      ease: "power2.out",
    });

    let activeItem = null;
    let previewRootRect = null;
    let pointerFrame = 0;
    let queuedPreviewState = null;

    const getPreviewRootRect = () => {
      if (!previewRootRect) {
        previewRootRect = previewRoot.getBoundingClientRect();
      }
      return previewRootRect;
    };

    const invalidatePreviewRootRect = () => {
      previewRootRect = null;
    };

    const flushPreviewState = () => {
      pointerFrame = 0;
      if (!queuedPreviewState) return;

      const { item, clientX, clientY } = queuedPreviewState;
      const rootRect = getPreviewRootRect();
      const localX = clientX - rootRect.left;
      const localY = clientY - rootRect.top;

      xTo(localX + siteUtils.getNumberOption(worksSwipePreviewConfig, "imageOffsetX", 18));
      yTo(localY + siteUtils.getNumberOption(worksSwipePreviewConfig, "imageOffsetY", -12));
      alphaTo(1);
      captionXTo(localX + siteUtils.getNumberOption(worksSwipePreviewConfig, "captionOffsetX", 28));
      captionYTo(localY + siteUtils.getNumberOption(worksSwipePreviewConfig, "captionOffsetY", 86));
      captionAlphaTo(1);

      queuedPreviewState = null;
    };

    const showPreview = (item, event) => {
      if (!(item instanceof HTMLElement)) return;
      const imageSrc = item.dataset.previewImage;
      const caption = item.dataset.previewCaption || item.textContent?.trim() || "";
      if (!imageSrc) return;

      if (activeItem !== item) {
        previewImage.setAttribute("src", imageSrc);
        previewImage.setAttribute("alt", caption);
        previewCaption.textContent = caption;
        activeItem = item;
      }

      queuedPreviewState = {
        item,
        clientX: event.clientX,
        clientY: event.clientY,
      };

      if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(flushPreviewState);
      }
    };

    const hidePreview = () => {
      activeItem = null;
      queuedPreviewState = null;
      alphaTo(0);
      captionAlphaTo(0);
    };

    items.forEach((item) => {
      item.addEventListener("pointermove", (event) => showPreview(item, event));
      item.addEventListener("pointerenter", (event) => showPreview(item, event));
      item.addEventListener("pointerleave", hidePreview);
      item.addEventListener("focus", (event) => {
        const rect = item.getBoundingClientRect();
        showPreview(item, {
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        });
      });
      item.addEventListener("blur", hidePreview);
    });

    previewRoot.addEventListener("pointerleave", hidePreview);
    previewRoot.addEventListener("pointerenter", invalidatePreviewRootRect);
    window.addEventListener("resize", invalidatePreviewRootRect, { passive: true });
    window.addEventListener("scroll", invalidatePreviewRootRect, { passive: true });
  }

  if (!window.__siteModules) window.__siteModules = {};
  window.__siteModules.initWorksSwipePreviewModule = initWorksSwipePreview;
})();
