(function registerPlayfulTitleHoverModule() {
  const siteRuntime = window.__siteRuntime || {};
  const queryElements =
    siteRuntime.queryElements ||
    ((selector, root = document) => Array.from(root.querySelectorAll(selector)));
  const registerSiteModule =
    siteRuntime.registerSiteModule ||
    ((moduleName, initModule) => {
      if (!window.__siteModules) window.__siteModules = {};
      window.__siteModules[moduleName] = initModule;
    });

  function initPlayfulTitleHoverModule(options = {}) {
    const {
      selectors = [],
      rotatePattern = [-5, 4, -2, 5, -4, 3],
      assets = {},
    } = options;

    const applyTitleMotionVars = (element, index) => {
      element.style.setProperty("--title-char-index", String(index));
      element.style.setProperty("--title-char-drift", `${(index % 5) - 2}px`);
      element.style.setProperty(
        "--title-char-rotate",
        `${rotatePattern[index % rotatePattern.length]}deg`
      );
    };

    queryElements(selectors.join(",")).forEach((title) => {
      if (title.dataset.playTitleReady === "true") return;

      const originalText = title.textContent || "";
      const accessibleText = originalText.replace(/\s+/g, " ").trim();
      if (!accessibleText) return;

      title.dataset.playTitleReady = "true";
      title.classList.add("play-title");
      title.setAttribute("aria-label", accessibleText);

      const fragment = document.createDocumentFragment();
      const sectionNode = title.getAttribute("data-section-node");
      const isPhotoTitle = sectionNode === "photo-title";
      const isPortfolioTitle = sectionNode === "portfolio-title";
      const isFeaturedTitle = sectionNode === "featured-title";
      let charIndex = 0;
      let iCountForPortfolio = 0;

      Array.from(title.childNodes).forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === "BR") {
          fragment.appendChild(document.createElement("br"));
          return;
        }

        const text = node.textContent || "";
        Array.from(text).forEach((char) => {
          if (char === "\n") return;

          if (isPhotoTitle && char === "O") {
            const sticker = document.createElement("span");
            const stickerImage = document.createElement("img");

            sticker.className =
              "play-title__sticker play-title__sticker--work-face";
            sticker.setAttribute("aria-hidden", "true");
            applyTitleMotionVars(sticker, charIndex);
            stickerImage.src = assets.workFace || "./imag/Group 1940699207.png";
            stickerImage.alt = "";
            stickerImage.decoding = "async";
            sticker.appendChild(stickerImage);
            fragment.appendChild(sticker);
            charIndex += 1;
            return;
          }

          if (isPortfolioTitle && char === "I") {
            iCountForPortfolio += 1;
            if (iCountForPortfolio === 2) {
              const group = document.createElement("span");
              const charSpan = document.createElement("span");
              const sticker = document.createElement("span");
              const stickerImage = document.createElement("img");

              group.className = "play-title__fire-group";
              applyTitleMotionVars(group, charIndex);

              charSpan.className = "play-title__char play-title__char--fire-anchor";
              charSpan.setAttribute("aria-hidden", "true");
              charSpan.textContent = char;

              sticker.className =
                "play-title__sticker play-title__sticker--light-bulb";
              sticker.setAttribute("aria-hidden", "true");
              stickerImage.src = assets.lightBulb || "./imag/灯泡 1.png";
              stickerImage.alt = "";
              stickerImage.decoding = "async";
              sticker.appendChild(stickerImage);
              group.append(charSpan, sticker);
              fragment.appendChild(group);
              charIndex += 1;
              return;
            }
          }

          if (isFeaturedTitle && char === "I") {
            const group = document.createElement("span");
            const charSpan = document.createElement("span");
            const sticker = document.createElement("span");
            const stickerImage = document.createElement("img");

            group.className = "play-title__fire-group";
            applyTitleMotionVars(group, charIndex);

            charSpan.className = "play-title__char play-title__char--fire-anchor";
            charSpan.setAttribute("aria-hidden", "true");
            charSpan.textContent = char;

            sticker.className =
              "play-title__sticker play-title__sticker--design-fire";
            sticker.setAttribute("aria-hidden", "true");
            stickerImage.src = assets.designFire || "./imag/Group 1940699208.png";
            stickerImage.alt = "";
            stickerImage.decoding = "async";
            sticker.appendChild(stickerImage);
            group.append(charSpan, sticker);
            fragment.appendChild(group);
            charIndex += 1;
            return;
          }

          const span = document.createElement("span");
          span.className =
            char.trim() === "" ? "play-title__space" : "play-title__char";
          span.setAttribute("aria-hidden", "true");
          span.textContent = char === " " ? "\u00a0" : char;
          applyTitleMotionVars(span, charIndex);
          fragment.appendChild(span);
          if (char.trim() !== "") charIndex += 1;
        });
      });

      title.replaceChildren(fragment);

      const interactiveSelector =
        ".play-title__char, .play-title__sticker--work-face, .play-title__fire-group";

      title.addEventListener("pointerover", (event) => {
        if (!(event.target instanceof Element)) return;
        if (!event.target.closest(interactiveSelector)) return;
        title.classList.add("is-hovering");
      });

      title.addEventListener("pointerout", (event) => {
        if (!(event.relatedTarget instanceof Node) || !title.contains(event.relatedTarget)) {
          title.classList.remove("is-hovering");
        }
      });

      title.addEventListener("pointerleave", () => {
        title.classList.remove("is-hovering");
      });
    });
  }

  registerSiteModule("initPlayfulTitleHoverModule", initPlayfulTitleHoverModule);
})();
