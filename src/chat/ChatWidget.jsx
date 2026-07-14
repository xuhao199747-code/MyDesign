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
      className="pointer-events-none fixed right-4 bottom-4 z-[9999] font-sans sm:right-5 sm:bottom-5"
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
          className="pointer-events-auto relative h-[56px] w-[100px] overflow-visible rounded-[20px] border-0 bg-transparent p-0 text-transparent shadow-none transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.04] hover:bg-transparent hover:shadow-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0 active:scale-[0.98]"
          type="button"
          variant="ghost"
          onMouseEnter={() => setIsTriggerHovered(true)}
          onMouseLeave={() => setIsTriggerHovered(false)}
          onFocus={() => setIsTriggerHovered(true)}
          onBlur={() => setIsTriggerHovered(false)}
          onClick={() => setIsOpen(true)}
        >
          <span className="absolute inset-0 z-10 drop-shadow-[0_8px_10px_rgba(15,23,42,0.14)] transition duration-200 group-hover/button:brightness-110 group-hover/button:saturate-115 group-hover/button:drop-shadow-[0_12px_14px_rgba(15,23,42,0.18)]">
            <span className="absolute inset-0 overflow-hidden rounded-[20px]">
              <Strands
                colors={["#FF4FD8", "#12B8FF", "#F6E77A"]}
                count={3}
                speed={isTriggerHovered ? 1.85 : 0.72}
                amplitude={1.85}
                waviness={1.18}
                thickness={0.86}
                glow={1.68}
                taper={2.7}
                spread={1.15}
                intensity={0.66}
                saturation={1.9}
                opacity={1}
                scale={1.42}
                glass
                refraction={0.24}
                dispersion={0.85}
                glassSize={1.06}
                hueShift={0.12}
              />
              <span className="strands-glass-orb strands-glass-orb--inner" />
            </span>
          </span>
          <span className="strands-glass-orb z-20" />
          <span className="sr-only">打开对话</span>
        </Button>
      )}
    </div>
  );
}
