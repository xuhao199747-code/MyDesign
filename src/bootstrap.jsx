import "./app.tailwind.css";
import "./BounceCards.css";
import "./CursorRing.css";
import "./components/Lanyard/Lanyard.css";

import {
  runBootstrapTasks,
  whenBrowserIdle,
  whenElementPresent,
  wrapBootstrapTask,
} from "./lib/bootstrap-page.js";

const nativeImport = (url) => new Function("url", "return import(url)")(url);

function loadRuntimeEntry(prodFileName, devPath) {
  if (import.meta.env.PROD) {
    const runtimeBaseUrl = import.meta.url.slice(0, import.meta.url.lastIndexOf("/") + 1);
    return nativeImport(`${runtimeBaseUrl}${prodFileName}`);
  }

  return nativeImport(new URL(devPath, import.meta.url).href);
}

function whenNavWechatLanyardRequested() {
  return () => {
    const mount = document.getElementById("navWechatLanyardMount");
    if (!mount) return null;

    let isLoading = false;
    const triggerSelector =
      '[data-shell-node="wechat-trigger"], [data-shell-node="wechat-footer-trigger"]';
    const loadLanyard = () => {
      if (isLoading || mount.dataset.reactMounted === "true") return;
      isLoading = true;
      document.getElementById("navWechatDrop")?.classList.add("is-loading");
      loadRuntimeEntry("navWechatLanyard.js", "./nav-wechat-lanyard-entry.jsx")
        .then(({ mountNavWechatLanyard }) => {
          mountNavWechatLanyard();
          const drop = document.getElementById("navWechatDrop");
          drop?.classList.add("is-ready");
          drop?.classList.remove("is-loading");
          if (drop?.classList.contains("is-open")) {
            window.requestAnimationFrame(() => {
              window.dispatchEvent(new CustomEvent("nav-wechat-card-open"));
            });
          }
        })
        .catch((error) => {
          isLoading = false;
          console.error("[nav-wechat-lanyard]", error);
        });
    };

    const loadFromEvent = (event) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(triggerSelector)) return;
      loadLanyard();
    };

    whenBrowserIdle(loadLanyard, 700);
    document.addEventListener("pointerover", loadFromEvent, { passive: true });
    document.addEventListener("focusin", loadFromEvent);
    document.addEventListener("touchstart", loadFromEvent, { passive: true });
    document.addEventListener("click", loadFromEvent, { passive: true });

    return null;
  };
}

runBootstrapTasks([
  wrapBootstrapTask(
    whenElementPresent("portfolioBounceCardsRootCopy", () =>
      loadRuntimeEntry("portfolioBounceCards.js", "./portfolio-bounce-cards.jsx")
        .then(({ mountPortfolioBounceCards }) => mountPortfolioBounceCards())
    )
  ),
  wrapBootstrapTask(
    whenBrowserIdle(
      whenElementPresent("ribbonsRoot", () =>
        loadRuntimeEntry("ribbonsEntry.js", "./ribbons-entry.jsx")
          .then(({ mountCursorRing }) => mountCursorRing())
      )
    )
  ),
  wrapBootstrapTask(
    whenBrowserIdle(
      whenElementPresent("chatWidgetRoot", () =>
        loadRuntimeEntry("chatWidget.js", "./chat/chat-entry.jsx")
          .then(({ mountChatWidget }) => mountChatWidget())
      ),
      260
    )
  ),
  wrapBootstrapTask(
    whenNavWechatLanyardRequested()
  ),
]);
