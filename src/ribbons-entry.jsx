import React from "react";
import { createRoot } from "react-dom/client";
import CursorRing from "./CursorRing.jsx";

const mount = document.getElementById("ribbonsRoot");

if (mount) {
  createRoot(mount).render(<CursorRing />);
}
