create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.founder_projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.founder_builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.founder_projects(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  project_type text not null,
  modules jsonb not null default '[]'::jsonb,
  architecture jsonb not null default '{}'::jsonb,
  files jsonb not null default '[]'::jsonb,
  preview_state jsonb not null default '{}'::jsonb,
  status text not null default 'completed' check (status in ('completed', 'restored', 'failed')),
  created_at timestamptz not null default now(),
  restored_at timestamptz
);

create index if not exists founder_projects_owner_user_id_idx
on public.founder_projects(owner_user_id);

create index if not exists founder_projects_created_at_idx
on public.founder_projects(created_at desc);

create index if not exists founder_builds_project_id_idx
on public.founder_builds(project_id);

create index if not exists founder_builds_owner_user_id_idx
on public.founder_builds(owner_user_id);

create index if not exists founder_builds_created_at_idx
on public.founder_builds(created_at desc);

drop trigger if exists set_founder_projects_updated_at on public.founder_projects;

create trigger set_founder_projects_updated_at
before update on public.founder_projects
for each row
execute function public.set_updated_at();

alter table public.founder_projects enable row level security;
alter table public.founder_builds enable row level security;

drop policy if exists "Users can read their own projects" on public.founder_projects;
create policy "Users can read their own projects"
on public.founder_projects
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "Users can create their own projects" on public.founder_projects;
create policy "Users can create their own projects"
on public.founder_projects
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "Users can update their own projects" on public.founder_projects;
create policy "Users can update their own projects"
on public.founder_projects
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "Users can delete their own projects" on public.founder_projects;
create policy "Users can delete their own projects"
on public.founder_projects
for delete
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "Users can read their own builds" on public.founder_builds;
create policy "Users can read their own builds"
on public.founder_builds
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "Users can create their own builds" on public.founder_builds;
create policy "Users can create their own builds"
on public.founder_builds
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "Users can update their own builds" on public.founder_builds;
create policy "Users can update their own builds"
on public.founder_builds
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "Users can delete their own builds" on public.founder_builds;
create policy "Users can delete their own builds"
on public.founder_builds
for delete
to authenticated
using (owner_user_id = auth.uid());