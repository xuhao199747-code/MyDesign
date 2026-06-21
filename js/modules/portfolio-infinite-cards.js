(function registerPortfolioInfiniteCardsModule() {
  function initPortfolioInfiniteCards(options = {}) {
    const {
      infiniteCardsConfig = {},
      siteUtils = {
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
      },
    } = options;
    if (typeof gsap === "undefined") return;
    if (typeof Draggable === "undefined") return;

    const root = document.querySelector(".portfolio-cards-section");
    const gallery = document.querySelector(".portfolio-gallery");
    const cardsRoot = document.querySelector(".portfolio-cards");
    if (!root || !gallery || !cardsRoot) return;
    if (root.dataset.portfolioCardsReady === "true") return;
    root.dataset.portfolioCardsReady = "true";

    const cards = gsap.utils.toArray(".portfolio-cards li");
    if (!cards.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("portfolio-cards-section--reduced");
      return;
    }

    const spacing = siteUtils.getNumberOption(infiniteCardsConfig, "spacing", 0.085);
    const overlap = siteUtils.getNumberOption(infiniteCardsConfig, "overlap", 0.6);
    const cardInterval = siteUtils.getNumberOption(infiniteCardsConfig, "cardInterval", 1);
    const dragFactor = siteUtils.getNumberOption(infiniteCardsConfig, "dragFactor", 0.0015);
    const wheelFactor = siteUtils.getNumberOption(infiniteCardsConfig, "wheelFactor", 0.0009);
    const wheelSettleDelayMs = siteUtils.getNumberOption(
      infiniteCardsConfig,
      "wheelSettleDelayMs",
      120
    );
    const loopIterationBase = siteUtils.getNumberOption(
      infiniteCardsConfig,
      "loopIterationBase",
      10
    );
    const loopStartMultiplier = siteUtils.getNumberOption(
      infiniteCardsConfig,
      "loopStartMultiplier",
      5
    );

    const buildSeamlessLoop = (items, spacingValue) => {
      const rawSequence = gsap.timeline({ paused: true });
      const seamlessLoop = gsap.timeline({
        paused: true,
        repeat: -1,
        onRepeat() {
          if (this._time === this._dur) {
            this._tTime += this._dur - 0.01;
          }
        },
      });
      const cycleDuration = spacingValue * items.length;
      const startTime = items.length * spacingValue + 0.5;
      const loopTime = (items.length + overlap) * spacingValue + 1;

      items
        .concat(items)
        .concat(items)
        .forEach((item, index) => {
          const animation = gsap
            .timeline()
            .fromTo(
              item,
              {
                scale: 0.85,
                opacity: 0,
              },
              {
                scale: 1,
                opacity: 1,
                zIndex: 100,
                duration: 0.5,
                yoyo: true,
                repeat: 1,
                ease: "power1.in",
                immediateRender: false,
              }
            )
            .fromTo(
              item,
              { xPercent: 250 },
              {
                xPercent: -250,
                duration: 1,
                ease: "none",
                immediateRender: false,
              },
              0
            );
          rawSequence.add(animation, index * spacingValue);
        });

      seamlessLoop
        .to(rawSequence, {
          time: loopTime,
          duration: loopTime - startTime,
          ease: "none",
        })
        .fromTo(
          rawSequence,
          { time: overlap * spacingValue + 1 },
          {
            time: startTime,
            duration: startTime - (overlap * spacingValue + 1),
            immediateRender: false,
            ease: "none",
          }
        );

      return seamlessLoop;
    };

    const loop = buildSeamlessLoop(cards, spacing);
    const scrub = gsap.to(loop, {
      totalTime: 0,
      duration: 0.5,
      ease: "power3",
      paused: true,
    });

    let iteration = 0;
    const trigger = {
      wrapForward(triggerValue) {
        iteration += 1;
        triggerValue.wrapping = true;
        triggerValue.scroll(triggerValue.start + 1);
      },
      wrapBackward(triggerValue) {
        iteration -= 1;
        if (iteration < 0) {
          iteration = loopIterationBase - 1;
          loop.totalTime(loop.totalTime() + loop.duration() * loopIterationBase);
          scrub.pause();
        }
        triggerValue.wrapping = true;
        triggerValue.scroll(triggerValue.end - 1);
      },
    };

    const progressToScroll = (progress) =>
      gsap.utils.clamp(1, trigger.end - 1, gsap.utils.wrap(0, 1, progress) * trigger.end);

    const scrollToOffset = (offset) => {
      const snappedTime = gsap.utils.snap(cardInterval, offset);
      const progress = (snappedTime - iteration * loop.duration()) / loop.duration();
      const scroll = progressToScroll(progress);
      trigger.scroll(scroll);
    };

    const draggable = Draggable.create(document.createElement("div"), {
      trigger: gallery,
      type: "x",
      inertia: true,
      onPress() {
        this.startOffset = scrub.vars.totalTime;
      },
      onDrag() {
        scrub.vars.totalTime = this.startOffset + (this.startX - this.x) * dragFactor;
        scrub.invalidate().restart();
      },
      onThrowUpdate() {
        scrub.vars.totalTime = this.startOffset + (this.startX - this.x) * dragFactor;
        scrub.invalidate().restart();
      },
      onRelease() {
        scrollToOffset(scrub.vars.totalTime);
      },
      onThrowComplete() {
        scrollToOffset(scrub.vars.totalTime);
      },
    })[0];

    const observerTarget = gallery;
    let wheelTimeout = null;
    let resizeTimer = null;
    let isCardsActive = true;

    observerTarget.addEventListener(
      "wheel",
      (event) => {
        if (!isCardsActive) return;
        event.preventDefault();
        const delta = event.deltaY || event.deltaX;
        scrub.vars.totalTime += delta * wheelFactor;
        scrub.invalidate().restart();

        if (wheelTimeout) window.clearTimeout(wheelTimeout);
        wheelTimeout = window.setTimeout(() => {
          scrollToOffset(scrub.vars.totalTime);
        }, wheelSettleDelayMs);
      },
      { passive: false }
    );

    trigger.start = 0;
    trigger.end = gallery.scrollWidth || 1;
    trigger.scroll = (value) => {
      gallery.scrollLeft = value;
    };

    loop.totalTime(loop.duration() * loopStartMultiplier);
    scrub.vars.totalTime = loop.totalTime();
    scrub.invalidate().restart();

    if ("IntersectionObserver" in window) {
      const cardsObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          isCardsActive = Boolean(entry?.isIntersecting);
        },
        {
          root: null,
          rootMargin: "20% 0px 20% 0px",
          threshold: 0,
        }
      );
      cardsObserver.observe(root);
    }

    window.addEventListener("resize", () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        trigger.end = gallery.scrollWidth || 1;
        scrollToOffset(scrub.vars.totalTime);
      }, 80);
    });
    void draggable;
  }

  if (!window.__siteModules) window.__siteModules = {};
  window.__siteModules.initPortfolioInfiniteCardsModule = initPortfolioInfiniteCards;
})();
