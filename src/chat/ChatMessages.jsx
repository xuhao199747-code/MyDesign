import React from "react";
import {
  BriefcaseBusinessIcon,
  DownloadIcon,
  FolderKanbanIcon,
  MessageCircleQuestionIcon,
} from "lucide-react";
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
import { Suggestion } from "@/components/ai-elements/suggestion";
import { ResumeDownloadMessage } from "./ResumeDownloadMessage.jsx";

function getSuggestionIcon(suggestion) {
  if (suggestion.includes("下载") || suggestion.includes("简历")) {
    return DownloadIcon;
  }
  if (suggestion.includes("项目")) {
    return FolderKanbanIcon;
  }
  if (suggestion.includes("工作")) {
    return BriefcaseBusinessIcon;
  }

  return MessageCircleQuestionIcon;
}

function ChatBubble({ message }) {
  return (
    <Message from={message.role}>
      <MessageContent>
        {message.type === "resume" ? (
          <ResumeDownloadMessage resume={message.resume} />
        ) : message.pending ? (
          <Shimmer className="text-sm">正在思考...</Shimmer>
        ) : (
          <MessageResponse>{message.text}</MessageResponse>
        )}
      </MessageContent>
    </Message>
  );
}

function ChatEmptyState({
  welcomeMessage,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-start bg-transparent pt-14 pr-6 pb-6 pl-4">
      <div className="ml-2 flex size-14 items-center justify-center">
        <img
          alt="徐浩 Agent"
          className="size-full rounded-full object-contain drop-shadow-xl"
          height="56"
          src="/imag/xuhao-agent-avatar.png"
          width="56"
        />
      </div>
      <div className="mt-5 ml-2 space-y-2">
        <h3 className="text-[21px] leading-7 font-semibold tracking-tight">今日事，我来帮。</h3>
        <p className="text-[15px] leading-6 text-muted-foreground">
          {welcomeMessage}
        </p>
      </div>
    </div>
  );
}

export function ChatSuggestions({
  disabled,
  onSuggestion,
  suggestions = [],
}) {
  if (!suggestions.length) return null;

  return (
    <div className="bg-transparent px-4 pt-1 pb-0">
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {suggestions.map((suggestion) => {
          const Icon = getSuggestionIcon(suggestion);

          return (
            <Suggestion
              className="h-8 shrink-0 justify-start gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[13px] font-normal text-foreground shadow-none hover:bg-white/90"
              disabled={disabled}
              key={suggestion}
              onClick={onSuggestion}
              size="sm"
              suggestion={suggestion}
              variant="outline"
            >
              <Icon className="size-3.5 text-muted-foreground" />
              <span className="whitespace-nowrap">{suggestion}</span>
            </Suggestion>
          );
        })}
      </div>
    </div>
  );
}

export function ChatMessages({
  messages,
  welcomeMessage,
}) {
  if (!messages.length) {
    return (
      <ChatEmptyState
        welcomeMessage={welcomeMessage}
      />
    );
  }

  return (
    <Conversation className="min-h-0 flex-1 bg-transparent">
      <ConversationContent className="gap-4 py-4 pr-6 pl-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
