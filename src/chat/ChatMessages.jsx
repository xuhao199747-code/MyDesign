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
  disabled,
  onSuggestion,
  suggestions,
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
      <div className="mt-4 space-y-0">
        {suggestions.map((suggestion) => {
          const Icon = getSuggestionIcon(suggestion);

          return (
            <Suggestion
              className="h-[34px] w-full justify-start gap-3 rounded-lg border-0 px-2 text-[15px] font-normal"
              disabled={disabled}
              key={suggestion}
              onClick={onSuggestion}
              size="default"
              suggestion={suggestion}
              variant="ghost"
            >
              <Icon className="size-4 text-muted-foreground" />
              <span className="truncate">{suggestion}</span>
            </Suggestion>
          );
        })}
      </div>
    </div>
  );
}

export function ChatMessages({
  disabled,
  messages,
  onSuggestion,
  suggestions = [],
  welcomeMessage,
}) {
  if (!messages.length) {
    return (
      <ChatEmptyState
        disabled={disabled}
        onSuggestion={onSuggestion}
        suggestions={suggestions}
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
