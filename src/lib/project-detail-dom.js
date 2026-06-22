import { getElementById } from "./dom-target.js";

export function getProjectDetailElements() {
  return {
    title: getElementById("projectTitle"),
    category: getElementById("projectCategory"),
    summary: getElementById("projectSummary"),
    description: getElementById("projectDescription"),
    image: getElementById("projectImage"),
    tags: getElementById("projectTags"),
  };
}
