import "./app.tailwind.css";

import {
  runBootstrapTasks,
  whenBrowserIdle,
  whenElementPresent,
  wrapBootstrapTask,
} from "./lib/bootstrap-page.js";

function whenNavWechatLanyardRequested() {
  return () => {
    const trigger = document.querySelector('[data-shell-node="wechat-trigger"]');
    const footerTrigger = document.querySelector('[data-shell-node="wechat-footer-trigger"]');
    const mount = document.getElementById("navWechatLanyardMount");
    if (!trigger || !mount) return null;

    let isLoading = false;
    const loadLanyard = () => {
      if (isLoading || mount.dataset.reactMounted === "true") return;
      isLoading = true;
      import("./nav-wechat-lanyard-entry.jsx")
        .then(({ mountNavWechatLanyard }) => mountNavWechatLanyard())
        .catch((error) => {
          isLoading = false;
          console.error("[nav-wechat-lanyard]", error);
        });
    };

    trigger.addEventListener("pointerenter", loadLanyard, { once: true, passive: true });
    trigger.addEventListener("focus", loadLanyard, { once: true });
    trigger.addEventListener("touchstart", loadLanyard, { once: true, passive: true });
    trigger.addEventListener("click", loadLanyard, { once: true });
    footerTrigger?.addEventListener("pointerenter", loadLanyard, { once: true, passive: true });
    footerTrigger?.addEventListener("focus", loadLanyard, { once: true });
    footerTrigger?.addEventListener("touchstart", loadLanyard, { once: true, passive: true });
    footerTrigger?.addEventListener("click", loadLanyard, { once: true });

    return null;
  };
}

runBootstrapTasks([
  wrapBootstrapTask(
    whenElementPresent("portfolioBounceCardsRootCopy", () =>
      import("./portfolio-bounce-cards.jsx").then(({ mountPortfolioBounceCards }) =>
        mountPortfolioBounceCards()
      )
    )
  ),
  wrapBootstrapTask(
    whenBrowserIdle(
      whenElementPresent("ribbonsRoot", () =>
        import("./ribbons-entry.jsx").then(({ mountCursorRing }) => mountCursorRing())
      )
    )
  ),
  wrapBootstrapTask(
    whenBrowserIdle(
      whenElementPresent("chatWidgetRoot", () =>
        import("./chat-widget-entry.jsx").then(({ mountChatWidget }) => mountChatWidget())
      ),
      260
    )
  ),
  wrapBootstrapTask(
    whenNavWechatLanyardRequested()
  ),
]);
