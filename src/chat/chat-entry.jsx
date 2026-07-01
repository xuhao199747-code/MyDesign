import React from "react";
import { getElementById } from "../lib/dom-target.js";
import { mountReactRoot } from "../lib/mount-react-root.js";
import { ChatWidget } from "./ChatWidget.jsx";

export function mountChatWidget() {
  const mount = getElementById("chatWidgetRoot");
  return mountReactRoot(mount, <ChatWidget />);
}
