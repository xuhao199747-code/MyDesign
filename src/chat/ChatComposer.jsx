import React from "react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

export function ChatComposer({ value, disabled, status, onChange, onSubmit }) {
  const handleSubmit = ({ text }) => {
    onSubmit(text);
  };

  const handleFocusInput = (event) => {
    if (event.target.closest("button")) return;
    if (event.target.closest("textarea")) return;
    event.preventDefault();
    event.currentTarget.querySelector("textarea")?.focus();
  };

  return (
    <div className="bg-transparent px-4 py-3">
      <PromptInput
        inputGroupClassName="rounded-[24px] border-black/10 bg-white shadow-none has-disabled:bg-white has-disabled:opacity-100 focus-within:border-foreground has-[[data-slot=input-group-control]:focus-visible]:!border-foreground has-[[data-slot=input-group-control]:focus-visible]:!ring-0"
        onMouseDown={handleFocusInput}
        onSubmit={handleSubmit}
      >
        <PromptInputBody>
          <PromptInputTextarea
            className="max-h-24 min-h-12 text-[15px]"
            disabled={disabled}
            placeholder="问我工作经历、项目过程，或者要一份简历"
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
