import "./app.tailwind.css";

import { runBootstrapTasks, whenElementPresent } from "./lib/bootstrap-page.js";
import { initSiteNavbar } from "./lib/init-site-navbar.js";

runBootstrapTasks([
  () => initSiteNavbar(),
  whenElementPresent("menuToggleIcon", () =>
    import("./MenuIcon.jsx").then(({ mountMenuIcon }) => mountMenuIcon())
  ),
  () => import("../project-detail.js").then(({ initProjectDetail }) => initProjectDetail()),
]);
