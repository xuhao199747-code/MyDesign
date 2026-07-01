create extension if not exists "pgcrypto";

create table if not exists public.assistant_config (
  id uuid primary key default gen_random_uuid(),
  system_prompt text not null default '',
  welcome_message text not null default '',
  api_limit_per_visitor integer not null default 20,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'general',
  title text not null default '',
  question_patterns text[] not null default '{}',
  answer text not null default '',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_settings (
  id uuid primary key default gen_random_uuid(),
  file_path text not null default '',
  external_url text not null default '',
  display_name text not null default '简历',
  updated_at timestamptz not null default now()
);

create table if not exists public.visitor_usage (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null unique,
  api_call_count integer not null default 0,
  last_called_at timestamptz,
  created_at timestamptz not null default now()
);

insert into public.assistant_config (
  id,
  system_prompt,
  welcome_message,
  api_limit_per_visitor,
  enabled
) values (
  '00000000-0000-0000-0000-000000000001',
  'You are the portfolio owner assistant. Answer clearly and honestly using the configured knowledge base.',
  'Hi, I can answer questions about my work, projects, and resume.',
  20,
  true
) on conflict (id) do nothing;

insert into public.resume_settings (
  id,
  display_name
) values (
  '00000000-0000-0000-0000-000000000001',
  '简历'
) on conflict (id) do nothing;

alter table public.assistant_config enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.resume_settings enable row level security;
alter table public.visitor_usage enable row level security;

drop policy if exists "public can read enabled assistant config" on public.assistant_config;
create policy "public can read enabled assistant config"
on public.assistant_config
for select
to anon, authenticated
using (enabled = true);

drop policy if exists "public can read enabled knowledge" on public.knowledge_items;
create policy "public can read enabled knowledge"
on public.knowledge_items
for select
to anon, authenticated
using (enabled = true);

drop policy if exists "public can read resume settings" on public.resume_settings;
create policy "public can read resume settings"
on public.resume_settings
for select
to anon, authenticated
using (true);

-- Admin writes and visitor usage writes are performed through Vercel API
-- routes with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS. Restrict direct
-- browser writes by omitting insert/update/delete policies here.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Resume uploads are handled by /api/resume-upload with
-- SUPABASE_SERVICE_ROLE_KEY after admin session validation. No direct browser
-- storage write policy is needed.
