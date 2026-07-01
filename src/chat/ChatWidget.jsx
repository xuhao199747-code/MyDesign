import React, { useEffect, useMemo, useRef, useState } from "react";
import { SparklesIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fallbackPublicConfig,
  fetchPublicAssistantConfig,
  fetchResumeDownload,
  sendChatMessage,
} from "./chatApi.js";
import { ChatComposer } from "./ChatComposer.jsx";
import { ChatMessages } from "./ChatMessages.jsx";
import { getVisitorId } from "./visitorId.js";

const createMessageId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [config, setConfig] = useState(fallbackPublicConfig);
  const [status, setStatus] = useState("ready");
  const [usage, setUsage] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState(
    fallbackPublicConfig.assistant.welcomeMessage
  );
  const [messages, setMessages] = useState([]);
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
      className="pointer-events-none fixed right-4 bottom-4 z-[9999] font-sans sm:right-5 sm:bottom-5"
      onClick={stopAssistantPointerEvent}
      onMouseDown={stopAssistantPointerEvent}
      onMouseUp={stopAssistantPointerEvent}
      onPointerDown={stopAssistantPointerEvent}
      onPointerUp={stopAssistantPointerEvent}
    >
      {isOpen ? (
        <Card
          className="pointer-events-auto h-[min(590px,calc(100dvh-32px))] w-[min(390px,calc(100vw-32px))] gap-0 rounded-[32px] border border-white bg-card/80 py-0 shadow-2xl shadow-foreground/10 backdrop-blur-xl"
          size="sm"
          aria-label="AI Assistant"
          role="dialog"
        >
          <div className="flex h-11 items-center gap-2 px-4">
            <h2 className="flex min-w-0 flex-1 items-baseline gap-2 truncate text-base font-medium">
              <span className="shrink-0">徐浩 Agent</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {usage
                  ? `剩余 ${usage.remaining} / ${usage.limit} 次 AI 对话`
                  : `每位访客 ${config?.assistant?.apiLimitPerVisitor || 20} 次 AI 对话`}
              </span>
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
            disabled={status === "submitted"}
            messages={messages}
            suggestions={suggestions}
            welcomeMessage={welcomeMessage}
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
          className="pointer-events-auto rounded-full shadow-xl shadow-foreground/15"
          size="lg"
          type="button"
          onClick={() => setIsOpen(true)}
        >
          <SparklesIcon className="size-4" />
          对话
        </Button>
      )}
    </div>
  );
}
