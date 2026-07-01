import React from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ResumeDownloadMessage } from "./ResumeDownloadMessage.jsx";

export function ChatMessages({ messages }) {
  return (
    <Conversation className="min-h-0 flex-1 bg-white">
      <ConversationContent className="gap-3 p-4">
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent
              className={
                message.role === "user"
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-800"
              }
            >
              {message.type === "resume" ? (
                <ResumeDownloadMessage resume={message.resume} />
              ) : message.pending ? (
                <Shimmer className="text-sm">Thinking...</Shimmer>
              ) : (
                <MessageResponse>{message.text}</MessageResponse>
              )}
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
