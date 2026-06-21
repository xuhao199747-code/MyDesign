import "./site-footer.tailwind.css";

import {
  runBootstrapTasks,
  whenBrowserIdle,
  whenElementPresent,
} from "./lib/bootstrap-page.js";

const safeTask = (task) => async () => {
  try {
    return await task();
  } catch (error) {
    console.error("[bootstrap]", error);
    return null;
  }
};

runBootstrapTasks([
  safeTask(
    whenElementPresent("portfolioBounceCardsRoot", () =>
      import("./portfolio-bounce-cards.jsx").then(({ mountPortfolioBounceCards }) =>
        mountPortfolioBounceCards()
      )
    )
  ),
  safeTask(
    whenBrowserIdle(
      whenElementPresent("ribbonsRoot", () =>
        import("./ribbons-entry.jsx").then(({ mountCursorRing }) => mountCursorRing())
      )
    )
  ),
  safeTask(
    whenBrowserIdle(
      whenElementPresent("chatWidgetRoot", () =>
        import("./chat-widget-entry.jsx").then(({ mountChatWidget }) => mountChatWidget())
      ),
      260
    )
  ),
]);
