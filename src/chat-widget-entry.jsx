import React from "react";
import { ChatWidget } from "./components/chat-widget.jsx";
import { getElementById } from "./lib/dom-target.js";
import { mountReactRoot } from "./lib/mount-react-root.js";
import { getSiteConfigSection } from "./lib/site-config.js";

const assistantWidgetConfig = getSiteConfigSection("assistantWidget");

export function mountChatWidget() {
  const mount = getElementById("chatWidgetRoot");
  return mountReactRoot(
    mount,
    <ChatWidget
      title={assistantWidgetConfig.title}
      subtitle={assistantWidgetConfig.subtitle}
      triggerLabel={assistantWidgetConfig.triggerLabel}
      closeLabel={assistantWidgetConfig.closeLabel}
      inputPlaceholder={assistantWidgetConfig.inputPlaceholder}
      submitLabel={assistantWidgetConfig.submitLabel}
      initialMessages={assistantWidgetConfig.initialMessages}
      buildAssistantReply={() =>
        assistantWidgetConfig.safeReply ||
        "Safe mode is active for now. Real AI and Elements will be wired back in after the page is stable."
      }
    />
  );
}
