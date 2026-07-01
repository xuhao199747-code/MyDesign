# Assistant Admin Setup

This project now includes an isolated visitor chat module and an isolated admin configuration module.

## Local Pages

- Homepage chat: `/`
- Admin page: `/admin.html`

The admin page does not load homepage animation scripts. It only mounts the React admin app.

## Required Environment Variables

Copy `.env.example` to `.env.local` for local testing, and add the same values in Vercel project settings:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

Browser-exposed values:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Server-only values:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
DEEPSEEK_MODEL
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `DEEPSEEK_API_KEY` in browser code.

`ADMIN_EMAILS` is optional. Use a comma-separated list, such as:

```text
ADMIN_EMAILS=you@example.com,other-admin@example.com
```

When set, `/api/admin-config` only accepts Supabase sessions whose email is in that list.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. In Supabase Auth, create the admin user with email/password.
5. Confirm the `resumes` Storage bucket exists.

The schema creates:

```text
assistant_config
knowledge_items
resume_settings
visitor_usage
resumes storage bucket
```

The admin app uploads PDF resumes to the private `resumes` bucket. The public chat receives signed resume URLs from `/api/resume`.

## Admin Workflow

1. Visit `/admin.html`.
2. Log in with the Supabase admin email/password.
3. Edit Prompt settings.
4. Add knowledge answers and matching keywords.
5. Upload a PDF resume or paste an external resume link.
6. Save config.

Knowledge items are used before DeepSeek:

```text
knowledge match -> direct answer -> no API call counted
resume request -> download action -> no API call counted
free-form question -> /api/chat -> DeepSeek call counted
```

## Visitor Limit

Each browser gets a `localStorage` visitor ID. `/api/chat` checks `visitor_usage` and allows up to the configured limit, defaulting to 20 DeepSeek calls.

The limit only applies to DeepSeek calls. Fixed knowledge-base answers and resume downloads remain available after the limit is reached.

## Local API Testing

Vite serves the frontend, but Vercel API routes need a serverless runtime. For local API testing, use:

```bash
npm run dev:vercel
```

Then test:

```bash
curl http://localhost:3000/api/public-config
```

Without Supabase environment variables, `/api/public-config` returns a safe fallback config. `/api/chat` requires Supabase and DeepSeek environment variables for real AI replies.

## Verification

Run:

```bash
npm run build
```

Expected:

- `dist/index.html` exists.
- `dist/admin.html` exists.
- `dist/assets/chatWidget.js` exists.
- Build exits with code 0.

The existing Vite warnings about legacy non-module script tags are expected for this project and are not introduced by the assistant/admin modules.
