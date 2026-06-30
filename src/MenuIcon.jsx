import React from "react";
import { getElementById } from "./lib/dom-target.js";
import { mountReactRoot } from "./lib/mount-react-root.js";
import { getSiteConfigSection } from "./lib/site-config.js";

const menuIconConfig = getSiteConfigSection("menuIcon");

function LightweightMenuIcon({ size = 28, color = "currentColor" }) {
  return React.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": "true",
      focusable: "false",
      style: {
        display: "block",
        color,
      },
    },
    React.createElement("path", {
      d: "M4 7.25H20M4 12H20M4 16.75H20",
      stroke: "currentColor",
      strokeWidth: 2.15,
      strokeLinecap: "round",
      vectorEffect: "non-scaling-stroke",
    })
  );
}

export function mountMenuIcon() {
  const container = getElementById("menuToggleIcon");
  return mountReactRoot(
    container,
    React.createElement(LightweightMenuIcon, {
      size: menuIconConfig.size,
      color: menuIconConfig.color,
    })
  );
}
