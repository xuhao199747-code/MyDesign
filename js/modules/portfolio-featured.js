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
    root.dataset.portfolioFeaturedLayout = "pending";

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
    let isPointerInsideRoot = false;
    let isTouchGestureActive = false;
    let isFeaturedVisible = true;
    let pressedCell = null;
    let pressedCellHref = "";
    let shouldNavigateOnPointerUp = false;
    let suppressNextClickNavigation = false;

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
      cell.draggable = false;
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
      if (!isFeaturedVisible) {
        motionFrame = null;
        updateCellMotion();
        return;
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

    function commitInitialLayout() {
      centerActiveCell(false);
      root.dataset.portfolioFeaturedLayout = "ready";
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

    const getRoundedRectRadius = (element, propertyName, fallback = 0) => {
      if (!(element instanceof HTMLElement)) return fallback;
      const value = Number.parseFloat(window.getComputedStyle(element)[propertyName]);
      return Number.isFinite(value) ? value : fallback;
    };

    const isPointInsideInteractiveZone = (cell, clientX, clientY, inset = 0) => {
      if (!(cell instanceof HTMLElement)) return false;
      const rect = cell.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;

      const media = cell.querySelector(".portfolio-featured__media");
      const shapeSource = media instanceof HTMLElement ? media : cell;
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const safeLeft = inset;
      const safeTop = inset;
      const safeRight = rect.width - inset;
      const safeBottom = rect.height - inset;

      if (
        localX < safeLeft ||
        localX > safeRight ||
        localY < safeTop ||
        localY > safeBottom
      ) {
        return false;
      }

      const safeWidth = Math.max(1, safeRight - safeLeft);
      const safeHeight = Math.max(1, safeBottom - safeTop);
      const maxRadius = Math.min(safeWidth, safeHeight) / 2;
      const radii = {
        tl: Math.min(
          maxRadius,
          Math.max(0, getRoundedRectRadius(shapeSource, "borderTopLeftRadius") - inset)
        ),
        tr: Math.min(
          maxRadius,
          Math.max(0, getRoundedRectRadius(shapeSource, "borderTopRightRadius") - inset)
        ),
        br: Math.min(
          maxRadius,
          Math.max(0, getRoundedRectRadius(shapeSource, "borderBottomRightRadius") - inset)
        ),
        bl: Math.min(
          maxRadius,
          Math.max(0, getRoundedRectRadius(shapeSource, "borderBottomLeftRadius") - inset)
        ),
      };

      const x = localX - safeLeft;
      const y = localY - safeTop;

      if (radii.tl > 0 && x < radii.tl && y < radii.tl) {
        const dx = x - radii.tl;
        const dy = y - radii.tl;
        return dx * dx + dy * dy <= radii.tl * radii.tl;
      }
      if (radii.tr > 0 && x > safeWidth - radii.tr && y < radii.tr) {
        const dx = x - (safeWidth - radii.tr);
        const dy = y - radii.tr;
        return dx * dx + dy * dy <= radii.tr * radii.tr;
      }
      if (radii.br > 0 && x > safeWidth - radii.br && y > safeHeight - radii.br) {
        const dx = x - (safeWidth - radii.br);
        const dy = y - (safeHeight - radii.br);
        return dx * dx + dy * dy <= radii.br * radii.br;
      }
      if (radii.bl > 0 && x < radii.bl && y > safeHeight - radii.bl) {
        const dx = x - radii.bl;
        const dy = y - (safeHeight - radii.bl);
        return dx * dx + dy * dy <= radii.bl * radii.bl;
      }

      return true;
    };

    track.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const cell = event.target.closest(".portfolio-featured__cell");
      if (!(cell instanceof HTMLElement)) return;

      if (suppressNextClickNavigation) {
        event.preventDefault();
        suppressNextClickNavigation = false;
        return;
      }

      const clickInset = siteUtils.getNumberOption(featuredConfig, "clickSafeInset", 8);
      const isSafeClick = isPointInsideInteractiveZone(
        cell,
        event.clientX,
        event.clientY,
        clickInset
      );

      if (dragMoved || !isSafeClick) {
        event.preventDefault();
      }
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

    const syncFeaturedHistoryLock = () => {
      const isFocusInsideRoot = !!document.activeElement && root.contains(document.activeElement);
      const shouldLockHistoryGesture =
        isPointerInsideRoot ||
        isPointerDown ||
        isTouchGestureActive ||
        isFocusInsideRoot ||
        document.documentElement.classList.contains("portfolio-featured-gesture-active");

      document.documentElement.classList.toggle(
        "portfolio-featured-history-lock",
        shouldLockHistoryGesture
      );
      document.body.classList.toggle("portfolio-featured-history-lock", shouldLockHistoryGesture);
    };

    const shouldSuppressBrowserBackGesture = (event) => {
      const target = event.target instanceof Node ? event.target : null;
      const isTargetInsideRoot = !!target && root.contains(target);
      const isFocusInsideRoot = !!document.activeElement && root.contains(document.activeElement);
      const horizontalDelta = Math.abs(event.deltaX || 0);
      const verticalDelta = Math.abs(event.deltaY || 0);
      const threshold = siteUtils.getNumberOption(featuredConfig, "wheelDeltaThreshold", 4);

      if (horizontalDelta < threshold || horizontalDelta <= verticalDelta) {
        return false;
      }

      return (
        isTargetInsideRoot ||
        isPointerInsideRoot ||
        isPointerDown ||
        isFocusInsideRoot ||
        document.documentElement.classList.contains("portfolio-featured-gesture-active")
      );
    };

    const suppressBrowserBackGesture = (event) => {
      if (!shouldSuppressBrowserBackGesture(event)) return;
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", suppressBrowserBackGesture, {
      passive: false,
      capture: true,
    });

    root.addEventListener("pointerenter", () => {
      isPointerInsideRoot = true;
      setFeaturedGestureActive();
      syncFeaturedHistoryLock();
    });
    root.addEventListener("pointerleave", () => {
      isPointerInsideRoot = false;
      clearFeaturedGestureActive();
      syncFeaturedHistoryLock();
    });
    root.addEventListener("focusin", () => {
      setFeaturedGestureActive();
      syncFeaturedHistoryLock();
    });
    root.addEventListener("focusout", () => {
      clearFeaturedGestureActive();
      syncFeaturedHistoryLock();
    });

    root.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) return;
        isTouchGestureActive = true;
        setFeaturedGestureActive();
        syncFeaturedHistoryLock();
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
          syncFeaturedHistoryLock();
          event.preventDefault();
        }
      },
      { passive: false }
    );

    root.addEventListener("touchend", () => {
      isTouchGestureActive = false;
      syncFeaturedHistoryLock();
    });

    root.addEventListener("touchcancel", () => {
      isTouchGestureActive = false;
      syncFeaturedHistoryLock();
    });

    root.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      const targetCell =
        event.target instanceof Element
          ? event.target.closest(".portfolio-featured__cell")
          : null;
      const pressInset = siteUtils.getNumberOption(featuredConfig, "pressSafeInset", 10);
      pressedCell = targetCell instanceof HTMLElement ? targetCell : null;
      pressedCellHref =
        pressedCell?.getAttribute("href") || pressedCell?.dataset.href || "";
      shouldNavigateOnPointerUp =
        !!pressedCell &&
        isPointInsideInteractiveZone(pressedCell, event.clientX, event.clientY, pressInset);
      if (
        targetCell instanceof HTMLElement &&
        !isPointInsideInteractiveZone(targetCell, event.clientX, event.clientY, pressInset)
      ) {
        return;
      }
      isPointerDown = true;
      dragAxis = "";
      dragMoved = false;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      initialActiveSlot = activeSlot;
      root.setPointerCapture?.(event.pointerId);
      if (event.pointerType === "mouse") {
        dragAxis = "x";
        setFeaturedGestureActive();
        document.body.classList.add("portfolio-featured-dragging");
      }
      syncFeaturedHistoryLock();
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

      if (event.cancelable) {
        event.preventDefault();
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
      if (root.hasPointerCapture?.(event.pointerId)) {
        root.releasePointerCapture(event.pointerId);
      }
      isPointerDown = false;
      const releasedAxis = dragAxis;
      dragAxis = "";
      clearFeaturedGestureActive();
      document.body.classList.remove("portfolio-featured-dragging");
      syncFeaturedHistoryLock();

      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;
      const releaseCell =
        event.target instanceof Element
          ? event.target.closest(".portfolio-featured__cell")
          : null;
      const tapThreshold = siteUtils.getNumberOption(featuredConfig, "dragThreshold", 10);
      const isTapLikeGesture =
        Math.abs(deltaX) < tapThreshold && Math.abs(deltaY) < tapThreshold;
      const canNavigateFromTap =
        shouldNavigateOnPointerUp &&
        pressedCell instanceof HTMLElement &&
        isTapLikeGesture &&
        isPointInsideInteractiveZone(
          pressedCell,
          event.clientX,
          event.clientY,
          siteUtils.getNumberOption(featuredConfig, "clickSafeInset", 8)
        ) &&
        (!releaseCell || releaseCell === pressedCell);

      if (canNavigateFromTap && pressedCellHref) {
        suppressNextClickNavigation = true;
        window.open(pressedCellHref, "_blank", "noopener,noreferrer");
        pressedCell = null;
        pressedCellHref = "";
        shouldNavigateOnPointerUp = false;
        dragMoved = false;
        return;
      }

      if (releasedAxis !== "x") {
        pressedCell = null;
        pressedCellHref = "";
        shouldNavigateOnPointerUp = false;
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
      pressedCell = null;
      pressedCellHref = "";
      shouldNavigateOnPointerUp = false;
    });

    root.addEventListener("pointercancel", () => {
      isPointerDown = false;
      dragAxis = "";
      dragMoved = false;
      pressedCell = null;
      pressedCellHref = "";
      shouldNavigateOnPointerUp = false;
      clearFeaturedGestureActive();
      document.body.classList.remove("portfolio-featured-dragging");
      syncFeaturedHistoryLock();
    });

    root.addEventListener("lostpointercapture", () => {
      if (!isPointerDown) return;
      isPointerDown = false;
      dragAxis = "";
      dragMoved = false;
      pressedCell = null;
      pressedCellHref = "";
      shouldNavigateOnPointerUp = false;
      clearFeaturedGestureActive();
      document.body.classList.remove("portfolio-featured-dragging");
      syncFeaturedHistoryLock();
      centerActiveCell(true);
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

    const scheduleInitialRecenter = () => {
      const recenter = () => {
        centerActiveCell(false);
        root.dataset.portfolioFeaturedLayout = "ready";
      };

      window.addEventListener("load", recenter, { once: true });
      window.addEventListener("pageshow", recenter, { once: true });

      window.setTimeout(recenter, 120);
      window.setTimeout(recenter, 320);
    };

    if ("IntersectionObserver" in window) {
      const featuredVisibilityObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          isFeaturedVisible = Boolean(entry?.isIntersecting);
          if (isFeaturedVisible) {
            updateCellMotion();
          } else if (motionFrame) {
            window.cancelAnimationFrame(motionFrame);
            motionFrame = null;
          }
        },
        {
          root: null,
          rootMargin: "24% 0px 24% 0px",
          threshold: 0,
        }
      );
      featuredVisibilityObserver.observe(root);
    }

    const initWithDelay = () => {
      let remainingFrames = Math.max(
        1,
        siteUtils.getNumberOption(featuredConfig, "initDelayFrames", 1)
      );
      const tick = () => {
        remainingFrames -= 1;
        if (remainingFrames <= 0) {
          commitInitialLayout();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    scheduleInitialRecenter();
    initWithDelay();
  }

  registerSiteModule("initPortfolioFeaturedModule", initPortfolioFeaturedShowcase);
})();
