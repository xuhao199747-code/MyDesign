import React from "react";
import CursorRing from "./CursorRing.jsx";
import { mountReactRoot } from "./lib/mount-react-root.js";

export function mountCursorRing() {
  const mount = document.getElementById("ribbonsRoot");
  return mountReactRoot(mount, <CursorRing />);
}
