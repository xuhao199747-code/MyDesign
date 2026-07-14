import React, { useEffect, useMemo, useRef, useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fallbackPublicConfig,
  fetchPublicAssistantConfig,
  fetchResumeDownload,
  sendChatMessage,
} from "./chatApi.js";
import { ChatComposer } from "./ChatComposer.jsx";
import { ChatMessages, ChatSuggestions } from "./ChatMessages.jsx";
import Strands from "./Strands.jsx";
import { getVisitorId } from "./visitorId.js";

const createMessageId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [config, setConfig] = useState(fallbackPublicConfig);
  const [status, setStatus] = useState("ready");
  const [usage, setUsage] = useState(null);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(
    fallbackPublicConfig.assistant.welcomeMessage
  );
  const [messages, setMessages] = useState([]);
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const visitorIdRef = useRef(null);

  const suggestions = useMemo(() => {
    const items = Array.isArray(config?.knowledgeItems)
      ? config.knowledgeItems
      : [];
    const fromKnowledge = items
      .filter((item) => item.enabled !== false)
      .map((item) => item.title || item.questionPatterns?.[0])
      .filter(Boolean)
      .slice(0, 2);

    return [...fromKnowledge, "下载简历"].slice(0, 4);
  }, [config]);

  useEffect(() => {
    visitorIdRef.current = getVisitorId();
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchPublicAssistantConfig().then((nextConfig) => {
      if (!isMounted) return;
      setConfig(nextConfig);
      if (nextConfig?.assistant?.welcomeMessage) {
        setWelcomeMessage(nextConfig.assistant.welcomeMessage);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsidePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };

    const listenerId = window.setTimeout(() => {
      document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    }, 0);

    return () => {
      window.clearTimeout(listenerId);
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
    };
  }, [isOpen]);

  const sendValue = async (rawValue) => {
    const value = rawValue.trim();
    if (!value || status === "submitted") return;

    const userMessage = {
      id: createMessageId("user"),
      role: "user",
      text: value,
    };

    const pendingId = createMessageId("assistant");
    setInput("");
    setStatus("submitted");
    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: pendingId,
        role: "assistant",
        text: "",
        pending: true,
      },
    ]);

    try {
      const result = await sendChatMessage({
        visitorId: visitorIdRef.current || getVisitorId(),
        messages: [...messages, userMessage].map((message) => ({
          role: message.role,
          content: message.text,
        })),
      });

      setUsage(result.usage || null);

      let resume = result.resume;
      if (result.type === "resume") {
        resume = await fetchResumeDownload(result.resume || config.resume);
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === pendingId
            ? {
                ...message,
                pending: false,
                type: result.type,
                resume,
                text: result.text || "I could not generate an answer.",
              }
            : message
        )
      );
    } catch (error) {
      const isLimit = error.data?.error === "limit_reached";
      setMessages((current) =>
        current.map((message) =>
          message.id === pendingId
            ? {
                ...message,
                pending: false,
                text: isLimit
                  ? `你已经用完 ${error.data.limit || 20} 次 AI 对话次数。固定知识库内容和简历下载仍然可以继续使用。`
                  : "AI 暂时没有连接成功，请稍后再试。",
              }
            : message
        )
      );
    } finally {
      setStatus("ready");
    }
  };

  const handleSubmit = async (value) => {
    await sendValue(value || input);
  };

  const handleSuggestion = (suggestion) => {
    void sendValue(suggestion);
  };

  const stopAssistantPointerEvent = (event) => {
    event.stopPropagation();
  };

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed right-4 bottom-4 z-[9999] font-sans sm:right-[100px] sm:bottom-[70px]"
      onClick={stopAssistantPointerEvent}
      onMouseDown={stopAssistantPointerEvent}
      onMouseUp={stopAssistantPointerEvent}
      onPointerDown={stopAssistantPointerEvent}
      onPointerUp={stopAssistantPointerEvent}
    >
      {isOpen ? (
        <Card
          ref={panelRef}
          className="pointer-events-auto h-[min(590px,calc(100dvh-32px))] w-[min(390px,calc(100vw-32px))] gap-0 rounded-[32px] border border-white bg-card/80 py-0 shadow-2xl shadow-foreground/10 backdrop-blur-xl"
          size="sm"
          aria-label="AI Assistant"
          role="dialog"
        >
          <div className="flex h-11 items-center gap-2 px-4">
            <h2 className="flex min-w-0 flex-1 items-baseline gap-2 truncate text-base font-medium">
              <span className="shrink-0">徐浩 Agent</span>
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="关闭对话"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
          <ChatMessages
            messages={messages}
            welcomeMessage={welcomeMessage}
          />
          <ChatSuggestions
            disabled={status === "submitted"}
            suggestions={suggestions}
            onSuggestion={handleSuggestion}
          />
          <ChatComposer
            disabled={status === "submitted"}
            status={status}
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
          />
        </Card>
      ) : (
        <Button
          aria-label="打开对话"
          className="pointer-events-auto relative h-[56px] w-[56px] overflow-visible rounded-none border-0 bg-transparent p-0 text-transparent shadow-none outline-none transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.04] hover:bg-transparent hover:shadow-none focus:border-0 focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 active:translate-y-0 active:scale-[0.98]"
          style={{ width: 56, height: 56, minWidth: 56, minHeight: 56, maxWidth: 56, maxHeight: 56 }}
          type="button"
          variant="ghost"
          onMouseEnter={() => setIsTriggerHovered(true)}
          onMouseLeave={() => setIsTriggerHovered(false)}
          onFocus={() => setIsTriggerHovered(true)}
          onBlur={() => setIsTriggerHovered(false)}
          onClick={() => setIsOpen(true)}
        >
          <span
            aria-hidden="true"
            className="strands-glass-front navbar navbar--scrolled glass-surface glass-surface--svg"
            style={{
              width: 56,
              height: 56,
              padding: 0,
              "--glass-frost": 0.24,
              "--glass-saturation": 1.08,
              "--filter-id": "url(#glass-filter)",
            }}
          />
          <Strands
            className="strands-orb-renderer"
            style={{
              width: 56,
              height: 56,
              maxWidth: 56,
              maxHeight: 56,
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
            }}
              colors={["#F97316", "#7C3AED", "#06B6D4"]}
              count={3}
              speed={isTriggerHovered ? 1.2 : 0.8}
              amplitude={1.2}
              waviness={2.2}
              thickness={1.1}
              glow={1.2}
              taper={4.9}
              spread={1.8}
              intensity={0.6}
              saturation={2}
              opacity={1}
              scale={1.6}
              glass
              refraction={1}
              dispersion={2.65}
              glassSize={1}
              hueShift={0.39}
          />
          <span className="sr-only">打开对话</span>
        </Button>
      )}
    </div>
  );
}
