import React from "react";
import CursorRing from "./CursorRing.jsx";
import { getElementById } from "./lib/dom-target.js";
import { mountReactRoot } from "./lib/mount-react-root.js";
import { getSiteConfigSection } from "./lib/site-config.js";

const cursorRingConfig = getSiteConfigSection("cursorRing");

export function mountCursorRing() {
  const mount = getElementById("ribbonsRoot");
  return mountReactRoot(mount, <CursorRing {...cursorRingConfig} />);
}
