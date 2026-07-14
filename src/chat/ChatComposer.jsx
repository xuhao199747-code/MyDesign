import React, { useRef } from "react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { SpeechInput } from "@/components/ai-elements/speech-input";

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function transcribeAudioBlob(audioBlob) {
  const audioBase64 = await blobToBase64(audioBlob);
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audioBase64,
      mimeType: audioBlob.type || "audio/wav",
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "transcription_failed");
  }

  console.warn("[chat-composer] transcribe response", {
    textLength: data.text?.length || 0,
  });
  return data.text || "";
}

export function ChatComposer({ value, disabled, status, onChange, onSubmit }) {
  const valueRef = useRef(value);
  const lastVoiceTextRef = useRef("");
  valueRef.current = value;

  const handleSubmit = ({ text }) => {
    onSubmit(text);
  };

  const handleFocusInput = (event) => {
    if (event.target.closest("button")) return;
    if (event.target.closest("textarea")) return;
    event.preventDefault();
    event.currentTarget.querySelector("textarea")?.focus();
  };

  const handleTranscriptionChange = (transcript) => {
    const text = transcript.trim();
    console.warn("[chat-composer] transcription change", {
      textLength: text.length,
    });
    if (!text) return;

    const previousVoiceText = lastVoiceTextRef.current;
    const currentValue = valueRef.current.trim();
    const baseValue =
      previousVoiceText && currentValue.endsWith(previousVoiceText)
        ? currentValue.slice(0, -previousVoiceText.length).trim()
        : currentValue;

    lastVoiceTextRef.current = text;
    onChange(baseValue ? `${baseValue} ${text}` : text);
  };

  const handleTranscriptionError = (error) => {
    console.error("[chat-composer] speech transcription failed", error);
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
        <PromptInputFooter className="justify-end gap-1">
          <SpeechInput
            aria-label="语音输入"
            className="size-8 bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground data-[recording=true]:bg-foreground"
            disabled={disabled}
            lang="zh-CN"
            onAudioRecorded={transcribeAudioBlob}
            onTranscriptionChange={handleTranscriptionChange}
            onTranscriptionError={handleTranscriptionError}
            recorderMimeType="audio/wav"
            type="button"
          />
          <PromptInputSubmit
            disabled={disabled || !value.trim()}
            status={status}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
