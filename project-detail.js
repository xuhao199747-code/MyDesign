import { initSiteNavbar } from "./src/lib/init-site-navbar.js";
import { getCurrentProjectSlug } from "./src/lib/page-context.js";
import { renderProjectDetail } from "./src/lib/render-project-detail.js";
import { getSiteConfigSection } from "./src/lib/site-config.js";
import { getProjectBySlug } from "./src/projectCatalog.js";

export function initProjectDetail() {
  const projectDetailConfig = getSiteConfigSection("projectDetail");
  const project = getProjectBySlug(getCurrentProjectSlug());
  renderProjectDetail(project);
  initSiteNavbar({
    closeOnHashChange: projectDetailConfig.closeOnHashChange ?? false,
  });
}
