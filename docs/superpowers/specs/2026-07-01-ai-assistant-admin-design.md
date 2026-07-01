# AI Assistant And Admin Design

## Goal

Build a new AI assistant and visual admin configuration system for the portfolio site. The previous admin implementation is not reused. The new system must be isolated from the existing homepage interactions and must use React, Tailwind, and ai-elements for both the chat module and the admin module.

## Confirmed Requirements

- The visitor-facing chat module uses React + Tailwind + ai-elements.
- The admin configuration module uses React + Tailwind + ai-elements.
- The model provider is DeepSeek.
- Admin login uses Supabase email/password authentication.
- Admin data is stored in Supabase.
- Resume delivery supports both uploaded PDF files and external links.
- Uploaded PDF resumes use Supabase Storage.
- External resume links are supported as a fallback.
- Each browser visitor can make up to 20 DeepSeek API calls.
- Knowledge base matches do not count toward the 20-call limit.
- Resume download requests do not count toward the 20-call limit.
- The new modules must not disturb existing homepage animations, navigation, cursor behavior, WeChat card behavior, or portfolio interactions.

## Current State

The current codebase does not contain an active admin module. Searches across the current workspace and git history did not find an existing `admin`, `api`, `server`, `backend`, `dashboard`, `supabase`, or `deepseek` implementation.

The current chat code is a safe-mode local React widget:

- `index.html` contains `#chatWidgetRoot`.
- `src/bootstrap.jsx` lazy-loads the chat widget during idle time.
- `src/chat-widget-entry.jsx` reads `assistantWidget` config.
- `src/components/chat-widget.jsx` stores messages in local React state.
- `js/site-config.js` contains fixed widget copy and a fixed safe reply.

This safe-mode implementation should be replaced by the new chat module rather than expanded into a large mixed-responsibility component.

## Architecture Choice

Use the selected option B: visitor chat embedded in the homepage, admin configuration in an independent page.

```text
index.html
  -> existing portfolio site
  -> #chatWidgetRoot
  -> lazy-loaded visitor chat module only

admin.html
  -> independent admin application
  -> #adminRoot
  -> no homepage animation scripts

api/*
  -> DeepSeek calls
  -> Supabase reads/writes
  -> visitor usage limits
```

This keeps the visitor experience integrated while preventing admin code and admin styles from entering the homepage runtime.

## Module Boundaries

### Visitor Chat Module

Proposed location:

```text
src/chat/
  chat-entry.jsx
  ChatWidget.jsx
  ChatMessages.jsx
  ChatComposer.jsx
  ResumeDownloadMessage.jsx
  chatApi.js
  visitorId.js
  knowledgeMatcher.js
```

Responsibilities:

- Mount only into `#chatWidgetRoot`.
- Render the floating assistant UI.
- Store local message state.
- Generate or read a browser visitor ID from `localStorage`.
- Ask the public config endpoint for knowledge and resume data.
- Return direct knowledge base answers when possible.
- Request DeepSeek through `/api/chat` only when free-form AI generation is needed.
- Show remaining API-call count when useful.
- Show resume download buttons when the user asks for a resume.

The chat module must not:

- Modify homepage scroll behavior.
- Register broad document-level behavior outside the widget, except the existing cursor-lock style event if still needed.
- Import or execute homepage interaction modules.
- Write admin configuration.

### Admin Module

Proposed location:

```text
src/admin/
  admin-entry.jsx
  AdminApp.jsx
  LoginView.jsx
  AdminLayout.jsx
  KnowledgeEditor.jsx
  PromptEditor.jsx
  ResumeEditor.jsx
  UsageView.jsx
  adminApi.js
  supabaseClient.js
```

Responsibilities:

- Mount only into `#adminRoot` in `admin.html`.
- Authenticate the owner through Supabase email/password login.
- Edit assistant configuration.
- Edit knowledge base items for personal experience, work experience, projects, skills, and FAQ.
- Edit the DeepSeek system prompt and assistant behavior instructions.
- Upload a PDF resume to Supabase Storage.
- Configure an external resume link.
- Display usage information such as visitor API-call counts and total calls.

The admin module must not:

- Load `script.js`.
- Load `js/modules/*`.
- Depend on homepage DOM structure.
- Change homepage CSS or animation configuration.

### API Module

Proposed location:

```text
api/
  chat.js
  public-config.js
  admin-config.js
  resume.js
```

Responsibilities:

- Keep DeepSeek API keys server-side.
- Keep Supabase service-role secrets server-side.
- Provide public read endpoints for enabled assistant config, knowledge items, and resume settings.
- Provide authenticated admin write endpoints if direct Supabase client writes are not sufficient.
- Enforce the 20-call DeepSeek limit per browser visitor.
- Increment usage only when DeepSeek is actually called.
- Return clear errors when the visitor has reached the API-call limit.

## Data Model

Suggested Supabase tables:

```text
assistant_config
  id uuid primary key
  system_prompt text
  welcome_message text
  api_limit_per_visitor integer default 20
  enabled boolean default true
  updated_at timestamptz

knowledge_items
  id uuid primary key
  category text
  title text
  question_patterns text[]
  answer text
  enabled boolean default true
  sort_order integer default 0
  updated_at timestamptz

resume_settings
  id uuid primary key
  file_path text
  external_url text
  display_name text
  updated_at timestamptz

visitor_usage
  id uuid primary key
  visitor_id text unique
  api_call_count integer default 0
  last_called_at timestamptz
  created_at timestamptz
```

Storage:

```text
Bucket: resumes
Allowed admin action: upload/update PDF
Allowed public action: download public or signed resume URL
```

## Chat Decision Flow

```text
User sends a message
  -> normalize message
  -> detect resume intent
    -> return resume download button
    -> no DeepSeek call
    -> no usage increment
  -> search enabled knowledge_items
    -> if matched, return configured answer
    -> no DeepSeek call
    -> no usage increment
  -> call /api/chat
    -> check visitor_usage for visitorId
    -> if api_call_count >= 20, reject with limit message
    -> call DeepSeek
    -> increment api_call_count
    -> return assistant response
```

Knowledge base examples that should not call DeepSeek:

- "你做过什么工作"
- "你有哪些项目"
- "你会什么技能"
- "可以下载你的简历吗"
- "联系方式是什么"

DeepSeek examples that should count as API calls:

- "结合我的需求总结你的优势"
- "哪个项目最适合电商方向"
- "把你的经历总结成一段招聘视角的话"
- "根据我的团队情况判断你适不适合"

## Resume Behavior

When the user asks for a resume:

```text
if uploaded PDF exists
  -> show PDF download button
else if external_url exists
  -> show external download button
else
  -> show configured unavailable message
```

Resume downloads do not count toward the 20-call limit.

## Isolation Rules

The implementation should prefer adding new files over modifying existing homepage files.

Prefer creating:

```text
admin.html
src/admin/*
src/chat/*
api/*
```

Allowed minimal edits:

```text
package.json
vite.config.mjs
index.html
src/bootstrap.jsx
```

Avoid changing unless explicitly needed:

```text
script.js
styles.css
js/modules/*
src/BounceCards.jsx
```

The current working tree already contains unrelated uncommitted changes in homepage files. Implementation must not revert or overwrite those changes.

## Build And Routing Plan

Vite should build separate entry chunks:

```text
chatWidget -> src/chat/chat-entry.jsx
adminApp -> src/admin/admin-entry.jsx
```

`index.html` should keep only the chat root for the visitor module:

```html
<div id="chatWidgetRoot" data-system-node="assistant-root"></div>
```

`admin.html` should contain only the admin root and admin entry script:

```html
<div id="adminRoot"></div>
<script type="module" src="/src/admin/admin-entry.jsx"></script>
```

The admin page should not include homepage script tags or homepage animation modules.

## Environment Variables

Expected variables:

```text
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
DEEPSEEK_MODEL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Only public-safe values may be exposed to browser code. DeepSeek and Supabase service-role secrets must remain server-side.

## Error Handling

Visitor chat:

- If public config fails to load, show a friendly fallback message and allow safe local retry.
- If knowledge matching fails, fall through to DeepSeek only if the visitor has remaining calls.
- If DeepSeek fails, show a retry message and do not increment usage.
- If the visitor reaches 20 calls, show a limit message and keep knowledge-base/resume features available.

Admin:

- If login fails, show a clear authentication error.
- If Supabase save fails, keep the edited content in the form and show a retry action.
- If resume upload fails, keep existing resume settings unchanged.

## Testing And Verification

Minimum checks:

- `npm run build` succeeds.
- Homepage still loads with existing animations.
- Chat opens from the bottom-right entry.
- Chat can return a knowledge-base answer without calling DeepSeek.
- Chat can return a resume download action without calling DeepSeek.
- DeepSeek calls increment visitor usage.
- The 21st DeepSeek call for the same visitor is blocked.
- `/admin.html` loads without homepage scripts.
- Supabase email/password login works.
- Admin can edit and save knowledge items.
- Admin can edit and save prompt settings.
- Admin can upload or configure resume download.

## Open Implementation Notes

- The exact ai-elements components should be chosen during implementation based on the installed package API.
- Supabase row-level security policies should be defined before production deployment.
- If Vercel serverless functions are used, API files must match Vercel's expected runtime format.
- If the project remains purely static, a serverless/API deployment target must be added before DeepSeek can be called securely.
