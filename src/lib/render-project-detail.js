export function renderProjectDetail(project) {
  const titleNode = document.getElementById("projectTitle");
  const kickerNode = document.getElementById("projectCategory");
  const summaryNode = document.getElementById("projectSummary");
  const bodyNode = document.getElementById("projectDescription");
  const imageNode = document.getElementById("projectImage");
  const tagsNode = document.getElementById("projectTags");

  document.title = `${project.title} | XUHAO DESIGN`;

  if (titleNode) titleNode.textContent = project.title;
  if (kickerNode) kickerNode.textContent = project.category;
  if (summaryNode) summaryNode.textContent = project.summary;
  if (bodyNode) bodyNode.textContent = project.description;

  if (imageNode) {
    imageNode.setAttribute("src", project.image);
    imageNode.setAttribute("alt", `${project.title} project cover`);
  }

  if (tagsNode) {
    tagsNode.innerHTML = "";
    project.tags.forEach((tag) => {
      const li = document.createElement("li");
      li.textContent = tag;
      tagsNode.appendChild(li);
    });
  }
}
