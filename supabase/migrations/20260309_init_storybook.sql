create extension if not exists "pgcrypto";

create table if not exists public.story_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  theme text not null,
  tone text not null,
  target_age text not null,
  child_count int not null check (child_count between 1 and 4),
  children_config jsonb not null default '[]'::jsonb,
  story_length text not null check (story_length in ('short', 'medium', 'long')),
  story_outline jsonb not null default '{}'::jsonb,
  current_page_number int not null default 1,
  status text not null check (status in ('active', 'completed'))
);

create table if not exists public.story_pages (
  id uuid primary key default gen_random_uuid(),
  story_session_id uuid not null references public.story_sessions(id) on delete cascade,
  page_number int not null,
  story_text text not null,
  drawing_prompt text not null,
  drawing_image_url text,
  drawing_summary text,
  generated_animation_url text,
  generation_status text not null default 'idle' check (generation_status in ('idle', 'pending', 'complete', 'failed')),
  generation_metadata jsonb,
  unique (story_session_id, page_number)
);

create table if not exists public.animation_jobs (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.story_pages(id) on delete cascade,
  provider text not null,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  simulate_ready_at timestamptz
);

create index if not exists idx_story_pages_session_id on public.story_pages(story_session_id);
create index if not exists idx_story_pages_generation_status on public.story_pages(generation_status);
create index if not exists idx_animation_jobs_page_id on public.animation_jobs(page_id);
create index if not exists idx_animation_jobs_status on public.animation_jobs(status);

alter table public.story_sessions enable row level security;
alter table public.story_pages enable row level security;
alter table public.animation_jobs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where tablename = 'story_sessions' and policyname = 'Allow service role all access sessions'
  ) then
    create policy "Allow service role all access sessions"
      on public.story_sessions
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where tablename = 'story_pages' and policyname = 'Allow service role all access pages'
  ) then
    create policy "Allow service role all access pages"
      on public.story_pages
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where tablename = 'animation_jobs' and policyname = 'Allow service role all access jobs'
  ) then
    create policy "Allow service role all access jobs"
      on public.animation_jobs
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;
