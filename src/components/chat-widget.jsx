import React, { useEffect, useRef, useState } from "react";

const createMessageId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultBuildAssistantReply = () =>
  "Safe mode is active for now. Real AI and Elements will be wired back in after the page is stable.";

export function ChatWidget({
  title = "Site Assistant",
  subtitle = "Bottom-right modal",
  triggerLabel = "Chat",
  closeLabel = "Close assistant",
  inputPlaceholder = "Safe mode first, AI next",
  submitLabel = "Send",
  initialMessages = [
    {
      id: "welcome",
      role: "assistant",
      text: "Assistant entry is back. Safe mode stays on first so the page layout remains stable.",
    },
  ],
  buildAssistantReply = defaultBuildAssistantReply,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);

  const setCursorLock = (locked) => {
    window.dispatchEvent(
      new CustomEvent("site-assistant:cursor-lock", {
        detail: { locked },
      })
    );
  };

  const openWidget = () => {
    setIsOpen(true);
  };

  const closeWidget = () => {
    setCursorLock(false);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    setCursorLock(true);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      closeWidget();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      setCursorLock(false);
    };
  }, [isOpen]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;

    const userMessage = {
      id: createMessageId("user"),
      role: "user",
      text: value,
    };

    const assistantMessage = {
      id: createMessageId("assistant"),
      role: "assistant",
      text: buildAssistantReply(value),
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-[9999] [font-family:'DM_Sans',sans-serif]">
      {isOpen ? (
        <>
          <div
            className="pointer-events-auto fixed inset-0 z-0 m-0 border-0 bg-transparent p-0"
            aria-hidden="true"
          />

          <div
            ref={panelRef}
            className="pointer-events-auto relative z-[2] flex h-[min(560px,calc(100vh-48px))] w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-[24px] border border-black/8 bg-white/95 shadow-[0_24px_60px_rgba(0,0,0,0.16)]"
            role="dialog"
            aria-label={title}
          >
            <div className="flex items-center justify-between border-b border-black/8 px-[18px] py-4">
              <div>
                <div className="text-[15px] font-bold text-[#111111]">{title}</div>
                <div className="mt-1 text-xs text-[#666666]">{subtitle}</div>
              </div>
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent text-[22px] leading-none text-[#111111]"
                onClick={closeWidget}
                aria-label={closeLabel}
              >
                x
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={[
                    "max-w-[88%] rounded-[18px] px-[14px] py-3 text-[13px] leading-[1.6]",
                    message.role === "assistant"
                      ? "bg-[#f2f2f2] text-[#111111]"
                      : "ml-auto bg-[#111111] text-white",
                  ].join(" ")}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <form
              className="flex gap-[10px] border-t border-black/8 px-4 pt-[14px] pb-4"
              onSubmit={handleSubmit}
            >
              <input
                ref={inputRef}
                className="min-w-0 flex-1 rounded-[14px] border border-black/12 px-[14px] py-3 text-[13px] outline-none"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={inputPlaceholder}
              />
              <button
                type="submit"
                className="cursor-pointer rounded-[14px] border-0 bg-[#111111] px-4 text-[13px] text-white"
              >
                {submitLabel}
              </button>
            </form>
          </div>
        </>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className="pointer-events-auto relative z-[2] cursor-pointer rounded-full border-0 bg-[#111111] px-5 py-[14px] text-sm text-white shadow-[0_16px_48px_rgba(0,0,0,0.2)]"
          onClick={openWidget}
        >
          {triggerLabel}
        </button>
      )}
    </div>
  );
}
