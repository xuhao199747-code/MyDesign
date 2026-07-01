import React, { useEffect, useRef, useState } from "react";
import { fetchPublicAssistantConfig, fallbackPublicConfig } from "./chatApi.js";
import { ChatComposer } from "./ChatComposer.jsx";
import { ChatMessages } from "./ChatMessages.jsx";
import {
  detectResumeIntent,
  findKnowledgeMatch,
} from "./knowledgeMatcher.js";
import { getVisitorId } from "./visitorId.js";

const createMessageId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [config, setConfig] = useState(fallbackPublicConfig);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi, I can answer questions about my work, projects, and resume.",
    },
  ]);
  const visitorIdRef = useRef(null);

  useEffect(() => {
    visitorIdRef.current = getVisitorId();
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchPublicAssistantConfig().then((nextConfig) => {
      if (!isMounted) return;
      setConfig(nextConfig);
      if (nextConfig?.assistant?.welcomeMessage) {
        setMessages((current) =>
          current.map((message) =>
            message.id === "welcome"
              ? { ...message, text: nextConfig.assistant.welcomeMessage }
              : message
          )
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;

    const userMessage = {
      id: createMessageId("user"),
      role: "user",
      text: value,
    };

    let assistantMessage;

    if (detectResumeIntent(value)) {
      assistantMessage = {
        id: createMessageId("assistant"),
        role: "assistant",
        type: "resume",
        resume: config.resume,
      };
    } else {
      const knowledgeMatch = findKnowledgeMatch(value, config);
      assistantMessage = {
        id: createMessageId("assistant"),
        role: "assistant",
        text:
          knowledgeMatch?.answer ||
          "The new assistant UI is mounted. DeepSeek wiring comes next.",
      };
    }

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-[9999] font-sans">
      {isOpen ? (
        <section
          className="pointer-events-auto flex h-[min(560px,calc(100vh-48px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl"
          aria-label="AI Assistant"
        >
          <header className="flex items-center justify-between border-b border-black/10 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">
                AI Assistant
              </h2>
              <p className="text-xs text-neutral-500">
                {config?.assistant?.apiLimitPerVisitor || 20} AI calls per
                visitor
              </p>
            </div>
            <button
              className="text-sm text-neutral-500"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </header>
          <ChatMessages messages={messages} />
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
          />
        </section>
      ) : (
        <button
          className="pointer-events-auto rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white shadow-xl"
          type="button"
          onClick={() => setIsOpen(true)}
        >
          Chat
        </button>
      )}
    </div>
  );
}
