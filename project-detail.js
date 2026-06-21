import { initSiteNavbar } from "./src/lib/init-site-navbar.js";
import { getCurrentProjectSlug } from "./src/lib/page-context.js";
import { renderProjectDetail } from "./src/lib/render-project-detail.js";
import { getProjectBySlug } from "./src/projectCatalog.js";

export function initProjectDetail() {
  const project = getProjectBySlug(getCurrentProjectSlug());
  renderProjectDetail(project);
  initSiteNavbar({ closeOnHashChange: false });
}
