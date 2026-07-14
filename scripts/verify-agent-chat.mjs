import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const bootstrap = read("src/bootstrap.jsx");
const chatWidget = read("src/chat/ChatWidget.jsx");
const chatMessages = read("src/chat/ChatMessages.jsx");
const chatComposer = read("src/chat/ChatComposer.jsx");
const inputGroup = read("src/components/ui/input-group.jsx");
const clickSurprise = read("js/modules/click-surprise-burst.js");
const siteUtils = read("js/site-utils.js");
const chatApi = read("api/chat.js");
const transcribeApi = read("api/transcribe.js");
const viteConfig = read("vite.config.mjs");

assert(
  bootstrap.includes('loadRuntimeEntry("chatWidget.js", "./chat/chat-entry.jsx")'),
  "dev bootstrap must load the same src/chat entry as the production chatWidget build"
);

assert(
  !bootstrap.includes("./chat-widget-entry.jsx"),
  "bootstrap must not load the legacy src/chat-widget-entry.jsx file"
);

assert(
  chatMessages.includes("@/components/ai-elements/message") &&
    chatMessages.includes("MessageResponse"),
  "chat messages must use ai-elements message and MessageResponse components"
);

assert(
  chatComposer.includes("@/components/ai-elements/prompt-input") &&
    !chatComposer.includes("<textarea") &&
    !chatComposer.includes("<input"),
  "chat composer must use ai-elements prompt-input instead of raw form controls"
);

assert(
  chatComposer.includes("@/components/ai-elements/speech-input") &&
    chatComposer.includes("onTranscriptionChange={handleTranscriptionChange}") &&
    chatComposer.includes("onAudioRecorded={transcribeAudioBlob}") &&
    chatComposer.includes('recorderMimeType="audio/wav"'),
  "chat composer must use ai-elements SpeechInput with Tencent ASR recorded-audio transcription"
);

const speechInput = read("src/components/ai-elements/speech-input.jsx");

assert(
  speechInput.includes("currentBrowserUnsupportedMessage") &&
    speechInput.includes("当前浏览器不支持语音转文字") &&
    speechInput.includes("preferAudioRecorded") &&
    speechInput.indexOf('if ("SpeechRecognition"') >= 0 &&
    speechInput.indexOf('if ("SpeechRecognition"') < speechInput.indexOf("preferAudioRecorded &&") &&
    speechInput.includes("continuous = false") &&
    speechInput.includes("interimResults = false") &&
    speechInput.includes("maxAlternatives = 1") &&
    speechInput.includes("preferAudioRecorded: Boolean(onAudioRecorded)") &&
    speechInput.includes("encodeWav") &&
    speechInput.includes("resampleAudio") &&
    speechInput.includes("resampledSamples") &&
    speechInput.includes("encodeWav(resampledSamples, 16000)") &&
    speechInput.includes("audioPeak") &&
    speechInput.includes("decodeAudioData"),
  "speech input must prefer recorded-audio transcription when a server ASR callback is provided"
);

assert(
  transcribeApi.includes("tencentcloud-sdk-nodejs-asr") &&
    transcribeApi.includes("SentenceRecognition") &&
    transcribeApi.includes("TENCENTCLOUD_SECRET_ID") &&
    transcribeApi.includes("TENCENTCLOUD_SECRET_KEY"),
  "api/transcribe.js must provide a server-only Tencent Cloud ASR transcription fallback"
);

assert(
  chatComposer.includes("const handleSubmit = ({ text })") &&
    chatComposer.includes("onSubmit={handleSubmit}"),
  "chat composer must consume ai-elements PromptInput onSubmit payload instead of a raw form event"
);

assert(
  chatComposer.includes("querySelector(\"textarea\")?.focus()") &&
    chatComposer.includes("onMouseDown={handleFocusInput}") &&
    chatComposer.includes("event.preventDefault()"),
  "chat composer must focus the textarea when the prompt input shell is clicked"
);

assert(
  chatComposer.includes("inputGroupClassName=") &&
    chatComposer.includes("rounded-[24px]") &&
    chatComposer.includes("has-[[data-slot=input-group-control]:focus-visible]:!ring-0") &&
    chatComposer.includes("has-[[data-slot=input-group-control]:focus-visible]:!border-foreground"),
  "chat composer focus and radius styles must target the rendered ai-elements input group"
);

assert(
  inputGroup.includes('querySelector("input, textarea")?.focus()'),
  "input group addons must focus textarea controls as well as input controls"
);

assert(
  clickSurprise.includes('document.addEventListener("pointerup", (event) =>') &&
    clickSurprise.includes("clearCurrentSelection(event.target)") &&
    clickSurprise.includes("if (isInsideAssistant(target)) return;"),
  "global click surprise selection cleanup must not run inside the assistant widget"
);

assert(
  siteUtils.includes('activeElement.matches("input, textarea, [contenteditable=') &&
    siteUtils.includes("activeElement.isContentEditable"),
  "site selection cleanup must not run while a text control is focused"
);

assert(
  chatMessages.includes("@/components/ai-elements/suggestion"),
  "chat widget must use ai-elements suggestions for prompt shortcuts"
);

assert(
  chatWidget.includes("@/components/ui/button") &&
    chatWidget.includes("@/components/ui/card") &&
    !chatWidget.includes("<button"),
  "chat widget shell must use shadcn button/card instead of raw buttons"
);

assert(
  chatWidget.includes("const stopAssistantPointerEvent = (event)") &&
    chatWidget.includes("event.stopPropagation()") &&
    chatWidget.includes("onPointerDown={stopAssistantPointerEvent}") &&
    chatWidget.includes("onPointerUp={stopAssistantPointerEvent}"),
  "chat widget root must isolate assistant pointer events from homepage global listeners"
);

assert(
  chatApi.includes("findKnowledgeMatch") &&
    chatApi.includes("detectResumeIntent") &&
    chatApi.indexOf("findKnowledgeMatch") < chatApi.indexOf("readVisitorUsage") &&
    chatApi.indexOf("detectResumeIntent") < chatApi.indexOf("readVisitorUsage"),
  "api/chat.js must resolve resume and knowledge answers before visitor usage limiting"
);

assert(
  chatApi.includes('type: "knowledge"') && chatApi.includes('type: "resume"'),
  "api/chat.js must return explicit knowledge and resume response types"
);

assert(
  chatApi.includes("fallbackConfig") &&
    chatApi.includes('mode: "local-preview"'),
  "api/chat.js must answer with fallback config when Supabase is not configured"
);

assert(
  viteConfig.includes("localApiRoutesPlugin") &&
    viteConfig.includes("api") &&
    viteConfig.includes("handler(req, res)"),
  "vite dev server must route /api/* requests to local API handlers"
);

if (failures.length) {
  console.error("Agent chat verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Agent chat verification passed.");
