import React from "react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

export function ChatComposer({ value, disabled, status, onChange, onSubmit }) {
  return (
    <div className="border-t border-black/10 bg-white p-3">
      <PromptInput
        className="rounded-xl border border-black/10 bg-white shadow-none"
        onSubmit={onSubmit}
      >
        <PromptInputBody>
          <PromptInputTextarea
            className="min-h-12 text-sm"
            disabled={disabled}
            placeholder="Ask about my work, projects, or resume"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </PromptInputBody>
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit
            disabled={disabled || !value.trim()}
            status={status}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
