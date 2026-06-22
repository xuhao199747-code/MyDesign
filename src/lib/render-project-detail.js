import { getProjectDetailElements } from "./project-detail-dom.js";
import { getSiteConfigSection } from "./site-config.js";

export function renderProjectDetail(project) {
  const elements = getProjectDetailElements();
  const projectDetailConfig = getSiteConfigSection("projectDetail");
  const documentTitleSuffix =
    projectDetailConfig.documentTitleSuffix || "XUHAO DESIGN";

  document.title = `${project.title} | ${documentTitleSuffix}`;

  if (elements.title) elements.title.textContent = project.title;
  if (elements.category) elements.category.textContent = project.category;
  if (elements.summary) elements.summary.textContent = project.summary;
  if (elements.description) elements.description.textContent = project.description;

  if (elements.image) {
    elements.image.setAttribute("src", project.image);
    elements.image.setAttribute("alt", `${project.title} project cover`);
  }

  if (elements.tags) {
    elements.tags.innerHTML = "";
    project.tags.forEach((tag) => {
      const li = document.createElement("li");
      li.textContent = tag;
      elements.tags.appendChild(li);
    });
  }
}
