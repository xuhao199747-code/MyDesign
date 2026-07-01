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
  '你是“徐浩 Agent”，是徐浩个人作品集网站里的中文 AI 助手。你的任务是帮助访客了解徐浩本人、他的产品与设计经历、前端/交互实现能力、作品集项目和简历信息。回答要自然、简洁、像作品集导览助手，不要说自己是投资组合拥有者助手。如果用户只是打招呼，例如“你好”，你应该回答：你好，这里是徐浩的作品集，我可以介绍他的经历、项目、技能，也可以帮你找到简历。如果不知道某个细节，不要编造公司、学历、年份或具体商业数据；可以说“目前作品集中没有写到这个细节”。',
  '你好，我是徐浩 Agent，可以回答关于徐浩的经历、作品项目、技能和简历的问题。',
  20,
  true
) on conflict (id) do nothing;

insert into public.knowledge_items (
  category,
  title,
  question_patterns,
  answer,
  enabled,
  sort_order
) values
  (
    'intro',
    '打招呼与身份',
    array['你好', '您好', 'hello', 'hi', '你是谁', '这是哪里', '徐浩是谁', '介绍一下徐浩'],
    '你好，这里是徐浩的作品集。我是徐浩 Agent，可以帮你了解他的产品与设计经历、前端交互实现能力、作品项目，也可以帮你找到简历。',
    true,
    0
  ),
  (
    'work',
    '工作经历',
    array['你做过什么工作', '工作经历', '经历', '徐浩经历', '做什么的', '从事什么'],
    '徐浩从事产品和设计工作，专注于设计和构建数字产品、品牌和体验。他的作品集重点展示了界面设计、交互体验、视觉表达、前端实现和 AI/Vibe Coding 方向的探索。',
    true,
    1
  ),
  (
    'projects',
    '项目经历',
    array['有哪些项目', '项目经历', '作品', '做过什么项目', '项目', '案例'],
    '作品集里主要有 Profile、Sneakers、About、Portrait 等设计项目，也有 Vibe Coding 相关作品，例如组件库、猪猪黄昏、LODING、BRAIN UI、SNEAKERS 等。整体方向是把设计表达、交互动画和前端实现结合起来。',
    true,
    2
  ),
  (
    'skills',
    '技能方向',
    array['会什么技能', '技能', '擅长', '能力', '技术栈'],
    '徐浩的能力集中在产品与视觉设计、界面结构、交互动效、品牌表达、前端页面实现，以及使用 AI/Vibe Coding 快速构建设计原型和网页体验。',
    true,
    3
  )
on conflict do nothing;

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

-- Admin writes are performed through Vercel API routes after fixed admin
-- credential validation. Supabase's newer server-side secret keys still honor
-- RLS, so these policies allow those routes to persist admin changes.
drop policy if exists "server can write assistant config" on public.assistant_config;
create policy "server can write assistant config"
on public.assistant_config
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "server can write knowledge items" on public.knowledge_items;
create policy "server can write knowledge items"
on public.knowledge_items
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "server can write resume settings" on public.resume_settings;
create policy "server can write resume settings"
on public.resume_settings
for all
to anon, authenticated
using (true)
with check (true);

-- Visitor usage is written only by /api/chat in this app. Supabase's newer
-- server-side secret keys still honor RLS, so these policies allow the API
-- route to read and upsert usage counters.
drop policy if exists "server can read visitor usage" on public.visitor_usage;
create policy "server can read visitor usage"
on public.visitor_usage
for select
to anon, authenticated
using (true);

drop policy if exists "server can insert visitor usage" on public.visitor_usage;
create policy "server can insert visitor usage"
on public.visitor_usage
for insert
to anon, authenticated
with check (true);

drop policy if exists "server can update visitor usage" on public.visitor_usage;
create policy "server can update visitor usage"
on public.visitor_usage
for update
to anon, authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Resume uploads are handled by /api/resume-upload with
-- SUPABASE_SERVICE_ROLE_KEY after admin session validation. No direct browser
-- storage write policy is needed.
