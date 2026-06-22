import React from "react";
import { MenuIcon } from "@animateicons/react/lucide";
import { getElementById } from "./lib/dom-target.js";
import { mountReactRoot } from "./lib/mount-react-root.js";
import { getSiteConfigSection } from "./lib/site-config.js";

const menuIconConfig = getSiteConfigSection("menuIcon");

export function mountMenuIcon() {
  const container = getElementById("menuToggleIcon");
  return mountReactRoot(
    container,
    React.createElement(MenuIcon, {
      size: menuIconConfig.size,
      duration: menuIconConfig.duration,
      color: menuIconConfig.color,
    })
  );
}
