import React from "react";
import { createRoot } from "react-dom/client";

const roots = new Map();

export function mountReactRoot(element, node) {
  if (!element) return null;

  let root = roots.get(element);
  if (!root) {
    root = createRoot(element);
    roots.set(element, root);
  }

  root.render(node);
  return root;
}
