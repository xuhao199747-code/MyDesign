export function getElementById(elementId) {
  return document.getElementById(elementId);
}

export function queryElement(selector, root = document) {
  return root.querySelector(selector);
}

export function queryElements(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function querySection(sectionName, root = document) {
  return queryElement(`[data-site-section="${sectionName}"]`, root);
}

export function querySectionNode(nodeName, root = document) {
  return queryElement(`[data-section-node="${nodeName}"]`, root);
}

export function queryShell(shellName, root = document) {
  return queryElement(`[data-site-shell="${shellName}"]`, root);
}

export function queryShellNode(nodeName, root = document) {
  return queryElement(`[data-shell-node="${nodeName}"]`, root);
}
