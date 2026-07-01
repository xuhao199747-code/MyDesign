(function registerClickSurpriseBurstModule() {
  const siteRuntime = window.__siteRuntime || {};
  const queryElement =
    siteRuntime.queryElement || ((selector, root = document) => root.querySelector(selector));
  const registerSiteModule =
    siteRuntime.registerSiteModule ||
    ((moduleName, initModule) => {
      if (!window.__siteModules) window.__siteModules = {};
      window.__siteModules[moduleName] = initModule;
    });

  function initClickSurpriseBurstModule(options = {}) {
    if (document.body.dataset.clickSurpriseReady === "true") return;
    document.body.dataset.clickSurpriseReady = "true";

    const {
      clickSurpriseConfig = {},
      siteUtils = {
        getArrayOption(_object, _key, fallback) {
          return fallback;
        },
        getNumberOption(_object, _key, fallback) {
          return fallback;
        },
        getStringOption(_object, _key, fallback) {
          return fallback;
        },
        clearTextSelection() {},
      },
    } = options;

    const shouldReduceBurstMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (shouldReduceBurstMotion) return;

    const defaultMessages = [
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
    ];
    const messages = siteUtils.getArrayOption(
      clickSurpriseConfig,
      "messages",
      defaultMessages
    );

    const defaultStickerSets = [
      ["✨", "💫", "⭐", "🌈", "🎉"],
      ["💥", "🎈", "💖", "🍀", "⚡"],
      ["🌟", "🎨", "🎊", "🧠", "🫶"],
      ["🪐", "🌙", "🔥", "🎁", "🫧"],
    ];
    const stickerSets = siteUtils.getArrayOption(
      clickSurpriseConfig,
      "stickerSets",
      defaultStickerSets
    );

    const assistantSelector = siteUtils.getStringOption(
      clickSurpriseConfig,
      "assistantSelector",
      "#chatWidgetRoot, .site-assistant__panel, .site-assistant__trigger"
    );
    const selectionLockDuration = siteUtils.getNumberOption(clickSurpriseConfig, "selectionLockDuration", 520);
    const burstTopOffset = siteUtils.getNumberOption(clickSurpriseConfig, "burstTopOffset", 28);
    const bubbleDelayMs = siteUtils.getNumberOption(clickSurpriseConfig, "bubbleDelayMs", 58);
    const bubbleBaseY = siteUtils.getNumberOption(clickSurpriseConfig, "bubbleBaseY", 58);
    const bubbleRandomY = siteUtils.getNumberOption(clickSurpriseConfig, "bubbleRandomY", 24);
    const bubbleBaseX = siteUtils.getNumberOption(clickSurpriseConfig, "bubbleBaseX", 10);
    const bubbleRandomX = siteUtils.getNumberOption(clickSurpriseConfig, "bubbleRandomX", 20);
    const bubbleRotateRange = siteUtils.getNumberOption(clickSurpriseConfig, "bubbleRotateRange", 8);
    const stickerSpreadBase = siteUtils.getNumberOption(clickSurpriseConfig, "stickerSpreadBase", 28);
    const stickerSpreadRandom = siteUtils.getNumberOption(clickSurpriseConfig, "stickerSpreadRandom", 42);
    const stickerStartXRange = siteUtils.getNumberOption(clickSurpriseConfig, "stickerStartXRange", 22);
    const stickerStartYRange = siteUtils.getNumberOption(clickSurpriseConfig, "stickerStartYRange", 14);
    const stickerLiftBase = siteUtils.getNumberOption(clickSurpriseConfig, "stickerLiftBase", 24);
    const stickerLiftRandom = siteUtils.getNumberOption(clickSurpriseConfig, "stickerLiftRandom", 28);
    const stickerRotateBase = siteUtils.getNumberOption(clickSurpriseConfig, "stickerRotateBase", 26);
    const stickerRotateRandom = siteUtils.getNumberOption(clickSurpriseConfig, "stickerRotateRandom", 52);
    const stickerDelayStepMs = siteUtils.getNumberOption(clickSurpriseConfig, "stickerDelayStepMs", 28);
    const angleSpreadRatio = siteUtils.getNumberOption(clickSurpriseConfig, "angleSpreadRatio", 0.94);

    const existingLayer = queryElement(".click-surprise-layer");
    const layer = existingLayer || document.createElement("div");
    if (!existingLayer) {
      layer.className = "click-surprise-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }

    let burstIndex = 0;
    let selectionLockTimer = null;

    const isInsideAssistant = (target) =>
      target instanceof Element && Boolean(target.closest(assistantSelector));

    const lockSelectionBriefly = (target) => {
      if (isInsideAssistant(target)) return;
      document.body.classList.add("is-click-surprise-active");
      if (selectionLockTimer) {
        window.clearTimeout(selectionLockTimer);
      }
      selectionLockTimer = window.setTimeout(() => {
        document.body.classList.remove("is-click-surprise-active");
        selectionLockTimer = null;
      }, selectionLockDuration);
    };

    const clearCurrentSelection = (target) => {
      if (isInsideAssistant(target)) return;
      siteUtils.clearTextSelection();
    };

    document.addEventListener("selectstart", (event) => {
      if (!document.body.classList.contains("is-click-surprise-active")) return;
      if (isInsideAssistant(event.target)) return;
      event.preventDefault();
    });

    document.addEventListener(
      "pointerdown",
      (event) => {
        lockSelectionBriefly(event.target);
      },
      { passive: true }
    );
    document.addEventListener("pointerup", (event) => {
      clearCurrentSelection(event.target);
    });

    document.addEventListener("click", (event) => {
      if (isInsideAssistant(event.target)) return;
      lockSelectionBriefly(event.target);
      clearCurrentSelection(event.target);

      const stickers = stickerSets[burstIndex % stickerSets.length];
      const bubbleText = messages[burstIndex % messages.length];
      burstIndex += 1;

      const burst = document.createElement("div");
      burst.className = "click-surprise-burst";
      burst.style.left = `${event.clientX}px`;
      burst.style.top = `${event.clientY - burstTopOffset}px`;

      stickers.forEach((sticker, index) => {
        const item = document.createElement("span");
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * angleSpreadRatio;
        const distance = stickerSpreadBase + Math.random() * stickerSpreadRandom;
        const startX = (Math.random() - 0.5) * stickerStartXRange;
        const startY = (Math.random() - 0.5) * stickerStartYRange;
        item.className = "click-surprise-sticker";
        item.textContent = sticker;
        item.style.setProperty("--burst-start-x", `${startX}px`);
        item.style.setProperty("--burst-start-y", `${startY}px`);
        item.style.setProperty("--burst-x", `${Math.cos(angle) * distance}px`);
        item.style.setProperty(
          "--burst-y",
          `${Math.sin(angle) * distance - stickerLiftBase - Math.random() * stickerLiftRandom}px`
        );
        item.style.setProperty("--burst-rotate", `${-stickerRotateBase + Math.random() * stickerRotateRandom}deg`);
        item.style.setProperty("--burst-delay", `${index * stickerDelayStepMs}ms`);
        burst.appendChild(item);
      });

      const bubble = document.createElement("span");
      bubble.className = "click-surprise-bubble";
      bubble.textContent = bubbleText;
      bubble.style.setProperty("--bubble-y", `${-bubbleBaseY - Math.random() * bubbleRandomY}px`);
      bubble.style.setProperty("--bubble-x", `${-bubbleBaseX + Math.random() * bubbleRandomX}px`);
      bubble.style.setProperty("--bubble-drift-x", `${-bubbleBaseX + Math.random() * bubbleRandomX}px`);
      bubble.style.setProperty("--bubble-rotate", `${-(bubbleRotateRange / 2) + Math.random() * bubbleRotateRange}deg`);
      bubble.style.setProperty("--bubble-delay", `${bubbleDelayMs}ms`);
      burst.appendChild(bubble);

      layer.appendChild(burst);
      burst.addEventListener("animationend", () => burst.remove(), { once: true });
    });
  }

  registerSiteModule("initClickSurpriseBurstModule", initClickSurpriseBurstModule);
})();
