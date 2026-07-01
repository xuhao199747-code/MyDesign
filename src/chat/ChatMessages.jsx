import React from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ResumeDownloadMessage } from "./ResumeDownloadMessage.jsx";

function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={[
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      ].join(" ")}
    >
      <div
        className={[
          "max-w-[88%] rounded-xl px-4 py-3 text-sm leading-6",
          isUser
            ? "bg-neutral-950 text-white"
            : "bg-neutral-100 text-neutral-800",
        ].join(" ")}
      >
        {message.type === "resume" ? (
          <ResumeDownloadMessage resume={message.resume} />
        ) : message.pending ? (
          <Shimmer className="text-sm">Thinking...</Shimmer>
        ) : (
          <p className="whitespace-pre-wrap">{message.text}</p>
        )}
      </div>
    </div>
  );
}

export function ChatMessages({ messages }) {
  return (
    <Conversation className="min-h-0 flex-1 bg-white">
      <ConversationContent className="gap-3 p-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
