import React from "react";
import "../app.tailwind.css";
import { getElementById } from "../lib/dom-target.js";
import { mountReactRoot } from "../lib/mount-react-root.js";
import { AdminApp } from "./AdminApp.jsx";

export function mountAdminApp() {
  const mount = getElementById("adminRoot");
  return mountReactRoot(mount, <AdminApp />);
}

mountAdminApp();
