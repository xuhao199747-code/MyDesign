import "./app.tailwind.css";

import {
  runBootstrapTasks,
  whenBrowserIdle,
  whenElementPresent,
  wrapBootstrapTask,
} from "./lib/bootstrap-page.js";

runBootstrapTasks([
  wrapBootstrapTask(
    whenElementPresent("portfolioBounceCardsRoot", () =>
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
    whenElementPresent("navWechatLanyardMount", () =>
      import("./nav-wechat-lanyard-entry.jsx").then(({ mountNavWechatLanyard }) =>
        mountNavWechatLanyard()
      )
    )
  ),
]);
