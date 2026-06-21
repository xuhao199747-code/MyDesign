import React from "react";
import { MenuIcon } from "@animateicons/react/lucide";
import { mountReactRoot } from "./lib/mount-react-root.js";

export function mountMenuIcon() {
  const container = document.getElementById("menuToggleIcon");
  return mountReactRoot(
    container,
    React.createElement(MenuIcon, {
      size: 24,
      duration: 1,
      color: "#0f172a",
    })
  );
}
