import { runBootstrapTasks, whenElementPresent } from "./lib/bootstrap-page.js";

runBootstrapTasks([
  whenElementPresent("menuToggleIcon", () =>
    import("./MenuIcon.jsx").then(({ mountMenuIcon }) => mountMenuIcon())
  ),
  () => import("../project-detail.js").then(({ initProjectDetail }) => initProjectDetail()),
]);
