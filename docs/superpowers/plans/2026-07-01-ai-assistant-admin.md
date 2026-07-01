# AI Assistant Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated portfolio AI assistant and admin configuration system using React, Tailwind, ai-elements, DeepSeek, and Supabase.

**Architecture:** The homepage keeps only a lazy-loaded visitor chat widget mounted at `#chatWidgetRoot`. The admin app runs from a separate `admin.html` page mounted at `#adminRoot` and does not load homepage animation scripts. Vercel serverless API routes own DeepSeek calls, Supabase service-role access, public config reads, and per-visitor API usage limits.

**Tech Stack:** React 19, Tailwind CSS 4, ai-elements local components, Vite 8, Vercel serverless functions, DeepSeek chat API, Supabase Auth, Supabase Database, Supabase Storage.

## Global Constraints

- Visitor chat module must use React + Tailwind + ai-elements.
- Admin configuration module must use React + Tailwind + ai-elements.
- Model provider is DeepSeek.
- Admin login uses Supabase email/password authentication.
- Each browser visitor can make up to 20 DeepSeek API calls.
- Knowledge base matches do not count toward the 20-call limit.
- Resume download requests do not count toward the 20-call limit.
- Resume delivery supports uploaded PDF files and external links.
- Uploaded PDF resumes use Supabase Storage.
- DeepSeek API key and Supabase service-role key must never be exposed to browser code.
- Existing homepage animations, navigation, cursor behavior, WeChat card behavior, and portfolio interactions must not be disturbed.
- The current worktree contains unrelated uncommitted homepage edits; do not revert or overwrite them.
- Prefer creating `admin.html`, `src/admin/*`, `src/chat/*`, and `api/*`.
- Avoid changing `script.js`, `styles.css`, `js/modules/*`, and `src/BounceCards.jsx` unless explicitly required.

---

## File Structure

Create:

- `admin.html`: independent admin shell with `#adminRoot`.
- `src/components/ai-elements/*`: installed ai-elements components used by chat/admin. Current implementation uses ai-elements `conversation`, `prompt-input`, `shimmer`, and `suggestion`; message bubbles are lightweight React + Tailwind to avoid pulling the markdown/mermaid rendering chain into the homepage-adjacent chat bundle.
- `src/chat/chat-entry.jsx`: chat entry point mounted by the existing lazy-load path.
- `src/chat/ChatWidget.jsx`: floating visitor chat shell.
- `src/chat/ChatMessages.jsx`: ai-elements-based message list.
- `src/chat/ChatComposer.jsx`: ai-elements-based prompt composer.
- `src/chat/ResumeDownloadMessage.jsx`: resume download action rendering.
- `src/chat/chatApi.js`: browser client for public config and chat API.
- `src/chat/visitorId.js`: localStorage visitor ID helper.
- `src/chat/knowledgeMatcher.js`: deterministic public knowledge/resume intent matching.
- `src/admin/admin-entry.jsx`: admin entry point for `admin.html`.
- `src/admin/AdminApp.jsx`: authenticated admin app controller.
- `src/admin/LoginView.jsx`: Supabase email/password login view.
- `src/admin/AdminLayout.jsx`: admin shell and navigation.
- `src/admin/KnowledgeEditor.jsx`: knowledge item editor.
- `src/admin/PromptEditor.jsx`: assistant config and system prompt editor.
- `src/admin/ResumeEditor.jsx`: resume upload/link editor.
- `src/admin/UsageView.jsx`: visitor usage summary.
- `src/admin/adminApi.js`: browser client for admin reads/writes.
- `src/admin/supabaseClient.js`: browser Supabase client using anon key.
- `api/_shared/env.js`: server-side environment helpers.
- `api/_shared/supabase.js`: server-side Supabase service-role client.
- `api/_shared/http.js`: shared response helpers.
- `api/public-config.js`: public enabled config, knowledge, and resume settings.
- `api/chat.js`: DeepSeek chat endpoint with 20-call limit.
- `api/admin-config.js`: authenticated admin config read/write endpoint.
- `api/resume.js`: signed/public resume URL endpoint.
- `supabase/schema.sql`: database tables, storage bucket notes, and RLS policy starter.
- `.env.example`: required local/deploy environment variables without secrets.

Modify:

- `package.json`: add `@supabase/supabase-js`; add an optional `dev:vercel` script if local API testing is needed.
- `vite.config.mjs`: add `admin` HTML input and point `chatWidget` to `src/chat/chat-entry.jsx`.
- `src/bootstrap.jsx`: keep the existing lazy load target name `chatWidget.js`; only update the imported module if needed by the build output.
- `index.html`: avoid edits unless `#chatWidgetRoot` is missing or duplicated.
- `src/app.tailwind.css`: only if ai-elements CLI adds required CSS variable imports or component styles.

Test:

- `npm run build`
- Browser smoke test of `/`
- Browser smoke test of `/admin.html`
- API smoke tests using local Vercel dev or deployed preview once environment variables exist.

---

### Task 1: Install And Pin AI Elements Components

**Files:**
- Create: `src/components/ai-elements/conversation.jsx`
- Create: `src/components/ai-elements/prompt-form.jsx`
- Create: `src/components/ai-elements/prompt-input.jsx`
- Create: `src/components/ai-elements/loader.jsx`
- Create: `src/components/ai-elements/response.jsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Possibly Modify: `src/app.tailwind.css`

**Interfaces:**
- Produces: local imports under `@/components/ai-elements/*`.
- Produces: installed component dependencies used by `src/chat/*` and `src/admin/*`.

- [ ] **Step 1: Install required runtime dependency**

Run:

```bash
npm install @supabase/supabase-js --legacy-peer-deps
```

Expected: `package.json` and `package-lock.json` include `@supabase/supabase-js`.

- [ ] **Step 2: Install only needed AI Elements components**

Run:

```bash
npx ai-elements@1.9.0 add conversation prompt-input suggestion shimmer
```

Expected: components are generated under the configured components alias, usually `src/components/ai-elements/`.

- [ ] **Step 3: Inspect generated files**

Run:

```bash
find src/components/ai-elements -maxdepth 1 -type f | sort
```

Expected: generated ai-elements component files exist. If the CLI adds shadcn utility components under `src/components/ui`, keep them only if required by ai-elements and do not use them directly in app code.

- [ ] **Step 4: Build after component install**

Run:

```bash
npm run build
```

Expected: build succeeds. Existing Vite warnings about non-module legacy script tags are acceptable if unchanged.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/ai-elements src/components/ui src/app.tailwind.css components.json
git commit -m "chore: install assistant ui components"
```

Only stage files that actually changed.

---

### Task 2: Add Isolated Admin Shell

**Files:**
- Create: `admin.html`
- Create: `src/admin/admin-entry.jsx`
- Create: `src/admin/AdminApp.jsx`
- Create: `src/admin/AdminLayout.jsx`
- Create: `src/admin/LoginView.jsx`
- Modify: `vite.config.mjs`

**Interfaces:**
- Consumes: `mountReactRoot(element, node)` from `src/lib/mount-react-root.js`.
- Produces: `/admin.html` page with `#adminRoot`.
- Produces: `AdminApp` component.

- [ ] **Step 1: Create `admin.html`**

Add:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Assistant Admin</title>
  </head>
  <body class="min-h-screen bg-neutral-950 text-white">
    <div id="adminRoot"></div>
    <script type="module" src="/src/admin/admin-entry.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `src/admin/admin-entry.jsx`**

Add:

```jsx
import React from "react";
import { AdminApp } from "./AdminApp.jsx";
import { getElementById } from "../lib/dom-target.js";
import { mountReactRoot } from "../lib/mount-react-root.js";
import "../app.tailwind.css";

export function mountAdminApp() {
  const mount = getElementById("adminRoot");
  return mountReactRoot(mount, <AdminApp />);
}

mountAdminApp();
```

- [ ] **Step 3: Create `src/admin/AdminApp.jsx`**

Add a first-pass unauthenticated shell:

```jsx
import React, { useState } from "react";
import { AdminLayout } from "./AdminLayout.jsx";
import { LoginView } from "./LoginView.jsx";

export function AdminApp() {
  const [session, setSession] = useState(null);

  if (!session) {
    return <LoginView onSignedIn={setSession} />;
  }

  return <AdminLayout session={session} onSignOut={() => setSession(null)} />;
}
```

- [ ] **Step 4: Create `src/admin/LoginView.jsx`**

Add a non-network placeholder that will be wired to Supabase in Task 5:

```jsx
import React from "react";

export function LoginView({ onSignedIn }) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Admin</p>
        <h1 className="mt-3 text-2xl font-semibold">Assistant Config</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Supabase email login will be connected in the next task.
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950"
          onClick={() => onSignedIn({ user: { email: "local-preview" } })}
        >
          Preview dashboard
        </button>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Create `src/admin/AdminLayout.jsx`**

Add:

```jsx
import React from "react";

export function AdminLayout({ session, onSignOut }) {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-6 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Assistant Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">配置中心</h1>
        </div>
        <button
          type="button"
          className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/80"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </header>
      <section className="mx-auto grid max-w-6xl gap-4 py-6 md:grid-cols-4">
        {["Knowledge", "Prompt", "Resume", "Usage"].map((item) => (
          <article key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-sm font-semibold">{item}</h2>
            <p className="mt-2 text-sm text-white/55">{session.user.email}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Update `vite.config.mjs` inputs**

Add `admin` to `rollupOptions.input`:

```js
admin: path.resolve(__dirname, 'admin.html'),
```

Keep existing homepage inputs unchanged.

- [ ] **Step 7: Build**

Run:

```bash
npm run build
```

Expected: build succeeds and `dist/admin.html` exists.

- [ ] **Step 8: Commit**

```bash
git add admin.html src/admin vite.config.mjs
git commit -m "feat: add isolated assistant admin shell"
```

---

### Task 3: Move Chat Into New Isolated Module

**Files:**
- Create: `src/chat/chat-entry.jsx`
- Create: `src/chat/ChatWidget.jsx`
- Create: `src/chat/ChatMessages.jsx`
- Create: `src/chat/ChatComposer.jsx`
- Create: `src/chat/ResumeDownloadMessage.jsx`
- Create: `src/chat/visitorId.js`
- Modify: `vite.config.mjs`
- Possibly Modify: `src/bootstrap.jsx`

**Interfaces:**
- Consumes: `#chatWidgetRoot`.
- Consumes: `mountReactRoot(element, node)`.
- Produces: `mountChatWidget()` exported from `src/chat/chat-entry.jsx`.
- Produces: `getVisitorId(): string`.

- [ ] **Step 1: Create `src/chat/visitorId.js`**

Add:

```js
const STORAGE_KEY = "portfolio-assistant-visitor-id";

export function getVisitorId() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id =
    window.crypto?.randomUUID?.() ||
    `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
```

- [ ] **Step 2: Create `src/chat/ChatMessages.jsx`**

Use generated ai-elements conversation imports and lightweight Tailwind bubbles:

```jsx
import React from "react";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Response } from "@/components/ai-elements/response";
import { ResumeDownloadMessage } from "./ResumeDownloadMessage.jsx";

export function ChatMessages({ messages }) {
  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="space-y-3 p-4">
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              {message.type === "resume" ? (
                <ResumeDownloadMessage resume={message.resume} />
              ) : (
                <Response>{message.text}</Response>
              )}
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
    </Conversation>
  );
}
```

- [ ] **Step 3: Create `src/chat/ChatComposer.jsx`**

Add:

```jsx
import React from "react";
import { PromptForm } from "@/components/ai-elements/prompt-form";
import { PromptInput, PromptInputTextarea, PromptInputSubmit } from "@/components/ai-elements/prompt-input";

export function ChatComposer({ value, disabled, onChange, onSubmit }) {
  return (
    <PromptForm onSubmit={onSubmit} className="border-t border-black/10 p-3">
      <PromptInput className="rounded-lg border border-black/10 bg-white">
        <PromptInputTextarea
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask about my work, projects, or resume"
        />
        <PromptInputSubmit disabled={disabled || !value.trim()} />
      </PromptInput>
    </PromptForm>
  );
}
```

- [ ] **Step 4: Create `src/chat/ResumeDownloadMessage.jsx`**

Add:

```jsx
import React from "react";

export function ResumeDownloadMessage({ resume }) {
  if (!resume?.url) {
    return <p className="text-sm text-neutral-700">简历暂时还没有配置下载地址。</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-700">可以，下面是我的简历下载入口。</p>
      <a
        className="inline-flex rounded-md bg-neutral-950 px-3 py-2 text-sm font-medium text-white"
        href={resume.url}
        target="_blank"
        rel="noreferrer"
      >
        下载{resume.displayName || "简历"}
      </a>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/chat/ChatWidget.jsx`**

Implement a local shell first, keeping safe-mode behavior until APIs exist:

```jsx
import React, { useEffect, useRef, useState } from "react";
import { ChatMessages } from "./ChatMessages.jsx";
import { ChatComposer } from "./ChatComposer.jsx";
import { getVisitorId } from "./visitorId.js";

const createMessageId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi, I can answer questions about my work, projects, and resume.",
    },
  ]);
  const inputVisitorId = useRef(null);

  useEffect(() => {
    inputVisitorId.current = getVisitorId();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;

    setMessages((current) => [
      ...current,
      { id: createMessageId("user"), role: "user", text: value },
      {
        id: createMessageId("assistant"),
        role: "assistant",
        text: "The new assistant UI is mounted. API wiring comes next.",
      },
    ]);
    setInput("");
  };

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] font-sans">
      {isOpen ? (
        <section className="pointer-events-auto flex h-[min(560px,calc(100vh-48px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-black/10 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">AI Assistant</h2>
              <p className="text-xs text-neutral-500">20 AI calls per visitor</p>
            </div>
            <button className="text-sm text-neutral-500" type="button" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </header>
          <ChatMessages messages={messages} />
          <ChatComposer value={input} onChange={setInput} onSubmit={handleSubmit} />
        </section>
      ) : (
        <button
          className="pointer-events-auto rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white shadow-xl"
          type="button"
          onClick={() => setIsOpen(true)}
        >
          Chat
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create `src/chat/chat-entry.jsx`**

Add:

```jsx
import React from "react";
import { ChatWidget } from "./ChatWidget.jsx";
import { getElementById } from "../lib/dom-target.js";
import { mountReactRoot } from "../lib/mount-react-root.js";

export function mountChatWidget() {
  const mount = getElementById("chatWidgetRoot");
  return mountReactRoot(mount, <ChatWidget />);
}
```

- [ ] **Step 7: Update `vite.config.mjs` chat input**

Change:

```js
chatWidget: path.resolve(__dirname, 'src/chat-widget-entry.jsx'),
```

to:

```js
chatWidget: path.resolve(__dirname, 'src/chat/chat-entry.jsx'),
```

- [ ] **Step 8: Build**

Run:

```bash
npm run build
```

Expected: build succeeds and `dist/assets/chatWidget.js` is generated from `src/chat/chat-entry.jsx`.

- [ ] **Step 9: Commit**

```bash
git add src/chat vite.config.mjs
git commit -m "feat: isolate assistant chat module"
```

---

### Task 4: Add Public Config And Knowledge Matching

**Files:**
- Create: `src/chat/chatApi.js`
- Create: `src/chat/knowledgeMatcher.js`
- Create: `api/_shared/http.js`
- Create: `api/public-config.js`
- Modify: `src/chat/ChatWidget.jsx`

**Interfaces:**
- Produces: `fetchPublicAssistantConfig(): Promise<AssistantPublicConfig>`.
- Produces: `findKnowledgeMatch(message, config): KnowledgeMatch | null`.
- Produces: `detectResumeIntent(message): boolean`.

- [ ] **Step 1: Create `src/chat/knowledgeMatcher.js`**

Add deterministic matching:

```js
const normalize = (value) => value.trim().toLowerCase();

const resumeKeywords = ["简历", "resume", "cv", "下载"];

export function detectResumeIntent(message) {
  const normalized = normalize(message);
  return resumeKeywords.some((keyword) => normalized.includes(keyword));
}

export function findKnowledgeMatch(message, config) {
  const normalized = normalize(message);
  const items = Array.isArray(config?.knowledgeItems) ? config.knowledgeItems : [];

  return (
    items.find((item) =>
      item.enabled !== false &&
      Array.isArray(item.questionPatterns) &&
      item.questionPatterns.some((pattern) => normalized.includes(normalize(pattern)))
    ) || null
  );
}
```

- [ ] **Step 2: Create `src/chat/chatApi.js`**

Add:

```js
export async function fetchPublicAssistantConfig() {
  const response = await fetch("/api/public-config");
  if (!response.ok) throw new Error("Failed to load assistant config");
  return response.json();
}
```

- [ ] **Step 3: Create `api/_shared/http.js`**

Add:

```js
export function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(res) {
  json(res, 405, { error: "method_not_allowed" });
}
```

- [ ] **Step 4: Create `api/public-config.js` with local fallback**

Add a fallback that works before Supabase is wired:

```js
import { json, methodNotAllowed } from "./_shared/http.js";

const fallbackConfig = {
  assistant: {
    welcomeMessage: "Hi, I can answer questions about my work, projects, and resume.",
    apiLimitPerVisitor: 20,
  },
  resume: {
    url: "",
    displayName: "简历",
  },
  knowledgeItems: [
    {
      id: "work",
      enabled: true,
      title: "工作经历",
      questionPatterns: ["你做过什么工作", "工作经历", "经历"],
      answer: "这部分会由后台知识库配置。当前是本地 fallback 内容。",
    },
  ],
};

export default function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  json(res, 200, fallbackConfig);
}
```

- [ ] **Step 5: Wire local knowledge matching in `ChatWidget.jsx`**

On mount, call `fetchPublicAssistantConfig()`. On submit, check `detectResumeIntent` and `findKnowledgeMatch` before returning the safe fallback response.

- [ ] **Step 6: Verify static build**

Run:

```bash
npm run build
```

Expected: frontend still builds. API route is not bundled by Vite, which is acceptable.

- [ ] **Step 7: Commit**

```bash
git add src/chat api
git commit -m "feat: add assistant public config matching"
```

---

### Task 5: Connect Supabase Auth And Admin Editors

**Files:**
- Create: `.env.example`
- Create: `src/admin/supabaseClient.js`
- Create: `src/admin/adminApi.js`
- Create: `src/admin/KnowledgeEditor.jsx`
- Create: `src/admin/PromptEditor.jsx`
- Create: `src/admin/ResumeEditor.jsx`
- Create: `src/admin/UsageView.jsx`
- Modify: `src/admin/AdminApp.jsx`
- Modify: `src/admin/LoginView.jsx`
- Modify: `src/admin/AdminLayout.jsx`
- Create: `supabase/schema.sql`

**Interfaces:**
- Produces: `getSupabaseClient()`.
- Produces: `fetchAdminConfig(session): Promise<AdminConfig>`.
- Produces: `saveAdminConfig(session, payload): Promise<AdminConfig>`.

- [ ] **Step 1: Create `.env.example`**

Add:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

- [ ] **Step 2: Create `src/admin/supabaseClient.js`**

Add:

```js
import { createClient } from "@supabase/supabase-js";

let client;

export function getSupabaseClient() {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }

  client = createClient(url, anonKey);
  return client;
}
```

- [ ] **Step 3: Replace preview login with Supabase login**

Update `LoginView.jsx` to call:

```js
const { data, error } = await getSupabaseClient().auth.signInWithPassword({
  email,
  password,
});
```

Expected: invalid credentials show an error, successful login sets session.

- [ ] **Step 4: Add admin editor components**

Create `KnowledgeEditor`, `PromptEditor`, `ResumeEditor`, and `UsageView` as controlled forms. They should accept `config`, `onChange`, `onSave`, and `saving` props where relevant.

- [ ] **Step 5: Create `supabase/schema.sql`**

Include SQL for `assistant_config`, `knowledge_items`, `resume_settings`, and `visitor_usage` tables, plus comments for a `resumes` storage bucket and RLS policies.

- [ ] **Step 6: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add .env.example src/admin supabase package.json package-lock.json
git commit -m "feat: connect assistant admin to supabase"
```

---

### Task 6: Add Supabase-Backed API Routes

**Files:**
- Create: `api/_shared/env.js`
- Create: `api/_shared/supabase.js`
- Modify: `api/public-config.js`
- Create: `api/admin-config.js`
- Create: `api/resume.js`
- Modify: `src/admin/adminApi.js`
- Modify: `src/chat/chatApi.js`

**Interfaces:**
- Produces: `getRequiredEnv(name): string`.
- Produces: `getServiceSupabaseClient()`.
- Produces: authenticated admin config reads/writes.
- Produces: public config reads.

- [ ] **Step 1: Create `api/_shared/env.js`**

Add:

```js
export function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
```

- [ ] **Step 2: Create `api/_shared/supabase.js`**

Add:

```js
import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "./env.js";

let client;

export function getServiceSupabaseClient() {
  if (client) return client;

  client = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );

  return client;
}
```

- [ ] **Step 3: Replace `api/public-config.js` fallback with Supabase reads**

Read one enabled assistant config row, enabled knowledge items, and resume settings. Keep the fallback only for missing tables during local development.

- [ ] **Step 4: Create `api/admin-config.js`**

Require a Bearer token, verify it with Supabase Auth, then support:

```text
GET /api/admin-config
PUT /api/admin-config
```

- [ ] **Step 5: Create `api/resume.js`**

Return the uploaded resume URL when `resume_settings.file_path` exists; otherwise return `external_url`.

- [ ] **Step 6: Wire admin and chat API clients**

Update `src/admin/adminApi.js` and `src/chat/chatApi.js` to call the new routes and pass auth tokens where required.

- [ ] **Step 7: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add api src/admin/adminApi.js src/chat/chatApi.js
git commit -m "feat: add supabase assistant api routes"
```

---

### Task 7: Add DeepSeek Chat And 20-Call Limit

**Files:**
- Modify: `api/chat.js`
- Modify: `src/chat/chatApi.js`
- Modify: `src/chat/ChatWidget.jsx`
- Modify: `src/chat/ChatMessages.jsx`

**Interfaces:**
- Produces: `sendChatMessage({ visitorId, messages }): Promise<ChatApiResult>`.
- API returns `{ type: "assistant", text, usage }` on success.
- API returns `{ error: "limit_reached", limit, used }` when limit is reached.

- [ ] **Step 1: Create `sendChatMessage` in `src/chat/chatApi.js`**

Add:

```js
export async function sendChatMessage(payload) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "chat_request_failed");
    error.data = data;
    throw error;
  }

  return data;
}
```

- [ ] **Step 2: Implement `api/chat.js`**

Use server-side environment variables:

```text
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
DEEPSEEK_MODEL
```

Pseudo-flow:

```js
if method is not POST -> 405
read visitorId and messages
load assistant_config.api_limit_per_visitor or default 20
load visitor_usage by visitorId
if api_call_count >= limit -> 429 limit_reached
call DeepSeek /chat/completions
if DeepSeek succeeds -> upsert visitor_usage with api_call_count + 1
return assistant text and usage count
if DeepSeek fails -> return 502 without incrementing usage
```

- [ ] **Step 3: Wire `ChatWidget.jsx` to async chat**

On unmatched free-form messages:

```text
append user message
append loading assistant message
call sendChatMessage
replace loading message with assistant reply
on limit error, show limit message
on failure, show retry message
```

- [ ] **Step 4: Verify limit behavior**

With a test `visitor_id`, set `api_call_count` to 20 in Supabase, then call:

```bash
curl -i -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"visitorId":"limit-test","messages":[{"role":"user","content":"hello"}]}'
```

Expected: HTTP 429 and `limit_reached`.

- [ ] **Step 5: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add api/chat.js src/chat
git commit -m "feat: connect assistant chat to deepseek"
```

---

### Task 8: Final Verification And Homepage Isolation Check

**Files:**
- Modify only files needed to fix verification failures.

**Interfaces:**
- Produces: verified homepage, chat, admin, API behavior.

- [ ] **Step 1: Build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 2: Start local app**

Run either:

```bash
npm run dev
```

or, for API route testing:

```bash
npx vercel dev
```

Expected: homepage and admin page are available locally.

- [ ] **Step 3: Homepage smoke test**

Open `/` and verify:

```text
homepage loads
preloader completes
navigation still works
cursor behavior still works
WeChat card behavior still works
portfolio interactions still work
chat button opens and closes
```

- [ ] **Step 4: Admin smoke test**

Open `/admin.html` and verify:

```text
homepage animation scripts are not loaded
Supabase login works
knowledge editor saves and reloads
prompt editor saves and reloads
resume editor supports uploaded PDF or external URL
usage view renders visitor counts
```

- [ ] **Step 5: Chat behavior smoke test**

Verify:

```text
resume request returns download action without usage increment
knowledge query returns configured answer without usage increment
free-form query calls DeepSeek and increments usage
21st DeepSeek call is blocked
DeepSeek failure does not increment usage
```

- [ ] **Step 6: Inspect git diff boundaries**

Run:

```bash
git status --short
git diff --stat
```

Expected: no accidental edits to `script.js`, `styles.css`, `js/modules/*`, or `src/BounceCards.jsx` unless a previous task explicitly required them.

- [ ] **Step 7: Commit verification fixes**

```bash
git add .
git commit -m "test: verify assistant admin integration"
```

Only commit if verification required code changes.

---

## Execution Notes

Implement Task 1 through Task 4 first if Supabase credentials are not yet available. Those tasks produce a buildable isolated frontend skeleton and local public-config fallback.

Implement Task 5 through Task 7 after the user provides:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
```

If credentials are unavailable, stop after Task 4 and deliver a local skeleton that can be connected later.
