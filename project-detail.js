import { getProjectBySlug } from "./src/projectCatalog.js";

const params = new URLSearchParams(window.location.search);
const project = getProjectBySlug(params.get("slug") || "");

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

const menuToggle = document.getElementById("menuToggle");
const menuWrap = document.getElementById("menuWrap");
const navbar = document.querySelector(".navbar");

if (menuToggle && menuWrap) {
  const isMobileViewport = () => window.innerWidth <= 768;

  const syncMenuOpenState = () => {
    const isOpen = isMobileViewport() && menuWrap.classList.contains("open");
    document.body.classList.toggle("menu-open", isOpen);
  };

  const closeMenu = () => {
    menuWrap.classList.remove("open");
    syncMenuOpenState();
  };

  menuToggle.addEventListener("click", () => {
    menuWrap.classList.toggle("open");
    syncMenuOpenState();
  });

  menuWrap.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!isMobileViewport()) return;
    if (!menuWrap.classList.contains("open")) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (menuWrap.contains(target) || menuToggle.contains(target)) return;
    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });

  syncMenuOpenState();
}

const NAVBAR_SCROLL_THRESHOLD = 8;

function updateNavbarScrolledState() {
  if (!navbar) return;
  navbar.classList.toggle(
    "navbar--scrolled",
    window.scrollY > NAVBAR_SCROLL_THRESHOLD
  );
}

if (navbar) {
  updateNavbarScrolledState();
  window.addEventListener("scroll", updateNavbarScrolledState, { passive: true });
}
