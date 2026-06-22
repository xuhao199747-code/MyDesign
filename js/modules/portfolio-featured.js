(function registerPortfolioFeaturedModule() {
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

  function initPortfolioFeaturedShowcase(options = {}) {
    const {
      featuredConfig = {},
      siteUtils = {
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
        getStringOption(_object, _key, fallback) {
          return fallback;
        },
      },
    } = options;
    const featuredElements = siteSections.getHomeSectionElements?.().featured || {};
    const root = featuredElements.root || queryElement(".portfolio-featured");
    if (!root) return;
    if (root.dataset.portfolioFeaturedReady === "true") return;

    const stage = featuredElements.stage || queryElement(".portfolio-featured__stage", root);
    const titleLink =
      featuredElements.titleLink || queryElement(".portfolio-featured__title", root);
    const prevButton =
      featuredElements.prevButton || queryElement(".portfolio-featured__nav--prev", root);
    const nextButton =
      featuredElements.nextButton || queryElement(".portfolio-featured__nav--next", root);
    if (!stage) return;
    root.dataset.portfolioFeaturedReady = "true";

    const items = Array.from(stage.querySelectorAll("[data-featured-card]")).map(
      (card, index) => {
        const image = card.querySelector("img");
        return {
          index,
          title: card.dataset.title || `Project ${index + 1}`,
          href: card.dataset.href || "#portfolio",
          src: image?.getAttribute("src") || "",
          alt: image?.getAttribute("alt") || "",
        };
      }
    );
    if (!items.length) return;

    const mobileBreakpoint = siteUtils.getNumberOption(featuredConfig, "mobileBreakpoint", 768);
    const loopCopies = siteUtils.getNumberOption(featuredConfig, "loopCopies", 15);
    const loopMiddle = Math.floor(loopCopies / 2);
    let activeSlot = loopMiddle * items.length;
    let isAnimating = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialActiveSlot = activeSlot;
    let touchStartX = 0;
    let touchStartY = 0;
    let isPointerDown = false;
    let dragMoved = false;
    let dragAxis = "";
    let wheelResetTimer = null;
    let motionFrame = null;
    let stepFallbackTimer = null;
    let gestureActiveTimer = null;
    let resizeTimer = null;
    let activeTiltCell = null;
    let activeTiltRect = null;

    const wrapIndex = (index) => (index + items.length) % items.length;
    const getSlotPitch = () => {
      if (cells.length < 2) return cells[0]?.offsetWidth || 1;
      return cells[1].offsetLeft - cells[0].offsetLeft || cells[0].offsetWidth || 1;
    };

    stage.innerHTML = "";
    const track = document.createElement("div");
    track.className = "portfolio-featured__track";
    stage.appendChild(track);

    const cells = Array.from({ length: items.length * loopCopies }, (_, slot) => {
      const item = items[wrapIndex(slot)];
      const cell = document.createElement("a");
      cell.className = "portfolio-featured__cell";
      cell.dataset.slot = String(slot);
      cell.dataset.itemIndex = String(item.index);
      cell.dataset.href = item.href;
      cell.dataset.title = item.title;
      cell.href = item.href;
      cell.setAttribute("aria-label", `查看 ${item.title}`);
      cell.innerHTML =
        '<span class="portfolio-featured__tilt"><span class="portfolio-featured__media"><img alt="" /></span></span><span class="portfolio-featured__badge"></span>';
      const image = cell.querySelector("img");
      const badge = cell.querySelector(".portfolio-featured__badge");
      if (image) {
        image.setAttribute("src", item.src);
        image.setAttribute("alt", item.alt);
      }
      if (badge) {
        badge.textContent = item.title;
      }
      track.appendChild(cell);
      return cell;
    });

    function updateCellStates() {
      const roundedSlot = Math.round(activeSlot);
      root.dataset.activeIndex = String(wrapIndex(roundedSlot));
      const activeItem = items[wrapIndex(roundedSlot)];
      if (titleLink && activeItem) {
        titleLink.href = activeItem.href;
        titleLink.textContent = activeItem.title;
      }
      cells.forEach((cell, slot) => {
        const offset = slot - activeSlot;
        const roundedOffset = slot - roundedSlot;
        cell.classList.toggle("is-active", roundedOffset === 0);
        cell.classList.toggle("is-prev", roundedOffset === -1);
        cell.classList.toggle("is-next", roundedOffset === 1);
        cell.classList.toggle("is-near", Math.abs(roundedOffset) === 2);
        cell.classList.toggle("is-far", Math.abs(roundedOffset) > 2);
        cell.style.setProperty("--featured-cell-offset", String(offset));
      });
    }

    function updateCellMotion() {
      const slotPitch = getSlotPitch();
      const isMobileViewport = window.innerWidth <= mobileBreakpoint;
      cells.forEach((cell, slot) => {
        const offset = slot - activeSlot;
        const distance = offset * slotPitch;
        const rotationStrength = isMobileViewport
          ? siteUtils.getNumberOption(featuredConfig, "mobileRotationStrength", 0.056)
          : siteUtils.getNumberOption(featuredConfig, "desktopRotationStrength", 0.042);
        const rotationLimit = isMobileViewport
          ? siteUtils.getNumberOption(featuredConfig, "mobileRotationLimit", 32)
          : siteUtils.getNumberOption(featuredConfig, "desktopRotationLimit", 25);
        const curveBase = isMobileViewport
          ? siteUtils.getNumberOption(featuredConfig, "mobileCurveBase", 10)
          : siteUtils.getNumberOption(featuredConfig, "desktopCurveBase", 6);
        const curveStrength = isMobileViewport
          ? siteUtils.getNumberOption(featuredConfig, "mobileCurveStrength", 96)
          : siteUtils.getNumberOption(featuredConfig, "desktopCurveStrength", 66);
        const curveRange = isMobileViewport
          ? siteUtils.getNumberOption(featuredConfig, "mobileCurveRange", 420)
          : siteUtils.getNumberOption(featuredConfig, "desktopCurveRange", 560);
        const rotation = Math.max(
          -rotationLimit,
          Math.min(rotationLimit, distance * rotationStrength)
        );
        const normalizedDistance = Math.min(1.35, Math.abs(distance) / curveRange);
        const curveY = curveBase + normalizedDistance * normalizedDistance * curveStrength;
        const badgeOpacity = Math.max(0, Math.min(1, Math.cos(distance * Math.PI / 600)));
        const badgeY = (1 - badgeOpacity) * 14;
        const badgeScale = 0.94 + badgeOpacity * 0.06;
        const badgeBlur = (1 - badgeOpacity) * 0.8;

        cell.style.setProperty("--featured-rotation", `${rotation.toFixed(3)}deg`);
        cell.style.setProperty("--featured-curve-y", `${curveY.toFixed(3)}px`);
        cell.style.setProperty("--featured-badge-opacity", badgeOpacity.toFixed(3));
        cell.style.setProperty("--featured-badge-y", `${badgeY.toFixed(3)}px`);
        cell.style.setProperty("--featured-badge-scale", `${badgeScale.toFixed(3)}`);
        cell.style.setProperty("--featured-badge-blur", `${badgeBlur.toFixed(3)}px`);
      });
    }

    function startMotionLoop(
      duration = siteUtils.getNumberOption(featuredConfig, "motionLoopDuration", 960)
    ) {
      if (motionFrame) {
        window.cancelAnimationFrame(motionFrame);
      }
      const endAt = performance.now() + duration;
      const tick = () => {
        updateCellMotion();
        if (performance.now() < endAt) {
          motionFrame = window.requestAnimationFrame(tick);
        } else {
          motionFrame = null;
          updateCellMotion();
        }
      };
      tick();
    }

    function centerActiveCell(animate = true) {
      const baseSlot = Math.floor(activeSlot);
      const activeCell = cells[baseSlot];
      if (!activeCell) return;
      updateCellStates();
      const slotProgress = activeSlot - baseSlot;
      const activeCenter =
        activeCell.offsetLeft + activeCell.offsetWidth / 2 + slotProgress * getSlotPitch();
      const stageCenter = stage.clientWidth / 2;
      const isMobileViewport = window.innerWidth <= mobileBreakpoint;
      const transitionDuration = isMobileViewport
        ? siteUtils.getStringOption(featuredConfig, "mobileTransitionDuration", "0.74s")
        : siteUtils.getStringOption(featuredConfig, "desktopTransitionDuration", "1.05s");
      const transitionEase = isMobileViewport
        ? siteUtils.getStringOption(featuredConfig, "mobileTransitionEase", "cubic-bezier(0.22, 0.98, 0.28, 1)")
        : siteUtils.getStringOption(featuredConfig, "desktopTransitionEase", "cubic-bezier(0.18, 1, 0.22, 1)");
      track.style.transition = animate
        ? `transform ${transitionDuration} ${transitionEase}`
        : "none";
      track.style.transform = `translate3d(${stageCenter - activeCenter}px, 0, 0)`;
      if (!animate) {
        void track.offsetWidth;
        track.style.transition = "";
      }
      startMotionLoop(animate
        ? siteUtils.getNumberOption(featuredConfig, "motionLoopAnimatedDuration", 1180)
        : siteUtils.getNumberOption(featuredConfig, "motionLoopStaticDuration", 120));
    }

    function resetLoopPosition() {
      const minSafeSlot = items.length * 3;
      const maxSafeSlot = items.length * (loopCopies - 3);
      if (activeSlot < minSafeSlot || activeSlot >= maxSafeSlot) {
        const realIndex = wrapIndex(activeSlot);
        activeSlot = loopMiddle * items.length + realIndex;
        root.classList.add("is-loop-resetting");
        centerActiveCell(false);
        window.requestAnimationFrame(() => {
          root.classList.remove("is-loop-resetting");
        });
      }
      root.classList.remove(
        "is-animating",
        "is-rolling-left",
        "is-rolling-right"
      );
      updateCellMotion();
      isAnimating = false;
    }

    function finishStep() {
      if (!isAnimating) return;
      if (stepFallbackTimer) {
        window.clearTimeout(stepFallbackTimer);
        stepFallbackTimer = null;
      }
      resetLoopPosition();
    }

    function stepFeaturedShowcase(direction) {
      if (isAnimating) return;
      isAnimating = true;
      root.classList.remove("is-rolling-left", "is-rolling-right");
      root.classList.add(
        "is-animating",
        direction > 0 ? "is-rolling-left" : "is-rolling-right"
      );

      activeSlot = Math.round(activeSlot) + direction;
      centerActiveCell(true);

      const onTrackEnd = (event) => {
        if (event.target !== track || event.propertyName !== "transform") return;
        track.removeEventListener("transitionend", onTrackEnd);
        finishStep();
      };
      track.addEventListener("transitionend", onTrackEnd);
      stepFallbackTimer = window.setTimeout(() => {
        track.removeEventListener("transitionend", onTrackEnd);
        finishStep();
      }, siteUtils.getNumberOption(featuredConfig, "stepFallbackMs", 1240));
    }

    const resetTilt = (cell) => {
      if (!cell) return;
      cell.style.setProperty("--featured-tilt-x", "0deg");
      cell.style.setProperty("--featured-tilt-y", "0deg");
      cell.style.setProperty("--featured-tilt-scale", "1");
    };

    track.addEventListener("click", (event) => {
      if (!dragMoved) return;
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(".portfolio-featured__cell")) return;
      event.preventDefault();
    });

    track.addEventListener("pointermove", (event) => {
      if (isPointerDown || dragMoved) return;
      if (!(event.target instanceof Element)) return;

      const cell = event.target.closest(".portfolio-featured__cell");
      if (!(cell instanceof HTMLElement)) {
        if (activeTiltCell) {
          resetTilt(activeTiltCell);
          activeTiltCell = null;
          activeTiltRect = null;
        }
        return;
      }

      if (activeTiltCell !== cell) {
        resetTilt(activeTiltCell);
        activeTiltCell = cell;
        activeTiltRect = cell.getBoundingClientRect();
      } else if (!activeTiltRect) {
        activeTiltRect = cell.getBoundingClientRect();
      }

      const edgeInset = siteUtils.getNumberOption(featuredConfig, "edgeInset", 14);
      const isInsideStableHoverZone =
        event.clientX >= activeTiltRect.left + edgeInset &&
        event.clientX <= activeTiltRect.right - edgeInset &&
        event.clientY >= activeTiltRect.top + edgeInset &&
        event.clientY <= activeTiltRect.bottom - edgeInset;

      if (!isInsideStableHoverZone) {
        resetTilt(cell);
        return;
      }

      const centerX = activeTiltRect.left + activeTiltRect.width / 2;
      const centerY = activeTiltRect.top + activeTiltRect.height / 2;
      const tiltMax = siteUtils.getNumberOption(featuredConfig, "tiltMax", 10);
      const rotateX = Math.max(
        -tiltMax,
        Math.min(
          tiltMax,
          ((event.clientY - centerY) / (activeTiltRect.height / 2)) * -tiltMax
        )
      );
      const rotateY = Math.max(
        -tiltMax,
        Math.min(
          tiltMax,
          ((event.clientX - centerX) / (activeTiltRect.width / 2)) * tiltMax
        )
      );
      cell.style.setProperty("--featured-tilt-x", `${rotateX.toFixed(3)}deg`);
      cell.style.setProperty("--featured-tilt-y", `${rotateY.toFixed(3)}deg`);
      cell.style.setProperty(
        "--featured-tilt-scale",
        String(siteUtils.getNumberOption(featuredConfig, "tiltScale", 1.02))
      );
    });

    track.addEventListener("pointerleave", () => {
      resetTilt(activeTiltCell);
      activeTiltCell = null;
      activeTiltRect = null;
    });

    prevButton?.addEventListener("click", () => stepFeaturedShowcase(-1));
    nextButton?.addEventListener("click", () => stepFeaturedShowcase(1));

    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepFeaturedShowcase(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepFeaturedShowcase(1);
      }
    });

    const setFeaturedGestureActive = () => {
      document.documentElement.classList.add("portfolio-featured-gesture-active");
      if (gestureActiveTimer) {
        window.clearTimeout(gestureActiveTimer);
      }
      gestureActiveTimer = window.setTimeout(() => {
        document.documentElement.classList.remove("portfolio-featured-gesture-active");
        gestureActiveTimer = null;
      }, siteUtils.getNumberOption(featuredConfig, "gestureActiveDuration", 700));
    };

    const clearFeaturedGestureActive = () => {
      if (gestureActiveTimer) {
        window.clearTimeout(gestureActiveTimer);
        gestureActiveTimer = null;
      }
      if (!isPointerDown) {
        document.documentElement.classList.remove("portfolio-featured-gesture-active");
      }
    };

    root.addEventListener("pointerenter", setFeaturedGestureActive);
    root.addEventListener("pointerleave", clearFeaturedGestureActive);
    root.addEventListener("focusin", setFeaturedGestureActive);
    root.addEventListener("focusout", clearFeaturedGestureActive);

    root.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) return;
        setFeaturedGestureActive();
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      },
      { passive: true }
    );

    root.addEventListener(
      "touchmove",
      (event) => {
        if (event.touches.length !== 1) return;
        const deltaX = event.touches[0].clientX - touchStartX;
        const deltaY = event.touches[0].clientY - touchStartY;
        const isHorizontalGesture =
          Math.abs(deltaX) > siteUtils.getNumberOption(featuredConfig, "horizontalGestureThreshold", 6) &&
          Math.abs(deltaX) > Math.abs(deltaY);
        if (isHorizontalGesture && event.cancelable) {
          setFeaturedGestureActive();
          event.preventDefault();
        }
      },
      { passive: false }
    );

    root.addEventListener("pointerdown", (event) => {
      isPointerDown = true;
      dragAxis = "";
      dragMoved = false;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      initialActiveSlot = activeSlot;
      if (event.pointerType === "mouse") {
        dragAxis = "x";
        setFeaturedGestureActive();
        document.body.classList.add("portfolio-featured-dragging");
      }
    });

    root.addEventListener("pointermove", (event) => {
      if (!isPointerDown) return;
      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;

      if (!dragAxis) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        if (
          absX < siteUtils.getNumberOption(featuredConfig, "dragThreshold", 10) &&
          absY < siteUtils.getNumberOption(featuredConfig, "dragThreshold", 10)
        ) return;
        if (absX > absY * siteUtils.getNumberOption(featuredConfig, "dragAxisBias", 1.12)) {
          dragAxis = "x";
          setFeaturedGestureActive();
          document.body.classList.add("portfolio-featured-dragging");
        } else if (absY > absX) {
          dragAxis = "y";
          clearFeaturedGestureActive();
          document.body.classList.remove("portfolio-featured-dragging");
          return;
        }
      }

      if (dragAxis !== "x") {
        return;
      }

      if (
        Math.abs(deltaX) > siteUtils.getNumberOption(featuredConfig, "dragThreshold", 10) ||
        Math.abs(deltaY) > siteUtils.getNumberOption(featuredConfig, "dragThreshold", 10)
      ) {
        dragMoved = Math.abs(deltaX) > Math.abs(deltaY);
      }

      const dragSensitivity = window.innerWidth <= mobileBreakpoint
        ? siteUtils.getNumberOption(featuredConfig, "mobileDragSensitivity", 0.76)
        : siteUtils.getNumberOption(featuredConfig, "desktopDragSensitivity", 1);
      const dragProgress = deltaX / (getSlotPitch() * dragSensitivity);
      activeSlot = initialActiveSlot - dragProgress;
      centerActiveCell(false);
    });

    root.addEventListener("pointerup", (event) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      const releasedAxis = dragAxis;
      dragAxis = "";
      clearFeaturedGestureActive();
      document.body.classList.remove("portfolio-featured-dragging");

      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;

      if (releasedAxis !== "x") {
        dragMoved = false;
        return;
      }

      root.classList.remove("is-animating", "is-rolling-left", "is-rolling-right");
      centerActiveCell(true);

      if (wheelResetTimer) {
        window.clearTimeout(wheelResetTimer);
      }
      wheelResetTimer = window.setTimeout(() => {
        resetLoopPosition();
      }, siteUtils.getNumberOption(featuredConfig, "wheelResetDelay", 140));

      window.setTimeout(() => {
        dragMoved = false;
      }, 0);
    });

    root.addEventListener("pointercancel", () => {
      isPointerDown = false;
      dragAxis = "";
      dragMoved = false;
      clearFeaturedGestureActive();
      document.body.classList.remove("portfolio-featured-dragging");
    });

    const handleFeaturedWheel = (event) => {
      const horizontalDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0;
      if (
        Math.abs(horizontalDelta) <
          siteUtils.getNumberOption(featuredConfig, "wheelDeltaThreshold", 4) &&
        !isAnimating
      ) return;

      setFeaturedGestureActive();
      event.preventDefault();
      event.stopPropagation();

      if (isAnimating) return;

      activeSlot += horizontalDelta / getSlotPitch();
      root.classList.remove("is-animating", "is-rolling-left", "is-rolling-right");
      centerActiveCell(false);

      if (wheelResetTimer) {
        window.clearTimeout(wheelResetTimer);
      }
      wheelResetTimer = window.setTimeout(() => {
        resetLoopPosition();
      }, siteUtils.getNumberOption(featuredConfig, "wheelResetDelay", 140));
    };

    root.addEventListener("wheel", handleFeaturedWheel, {
      passive: false,
      capture: true,
    });

    window.addEventListener("resize", () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        centerActiveCell(false);
      }, siteUtils.getNumberOption(featuredConfig, "resizeDebounceMs", 80));
    });
    
    const initWithDelay = () => {
      let remainingFrames = Math.max(
        1,
        siteUtils.getNumberOption(featuredConfig, "initDelayFrames", 1)
      );
      const tick = () => {
        remainingFrames -= 1;
        if (remainingFrames <= 0) {
          centerActiveCell(false);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    initWithDelay();
  }

  registerSiteModule("initPortfolioFeaturedModule", initPortfolioFeaturedShowcase);
})();
