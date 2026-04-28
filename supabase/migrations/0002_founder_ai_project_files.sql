create table if not exists public.founder_project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.founder_projects(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  contents text not null default '',
  description text,
  status text not null default 'updated' check (status in ('created', 'updated', 'checked', 'deleted')),
  last_build_id uuid references public.founder_builds(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, path)
);

create index if not exists founder_project_files_project_id_idx
on public.founder_project_files(project_id);

create index if not exists founder_project_files_owner_user_id_idx
on public.founder_project_files(owner_user_id);

create index if not exists founder_project_files_path_idx
on public.founder_project_files(path);

create index if not exists founder_project_files_updated_at_idx
on public.founder_project_files(updated_at desc);

drop trigger if exists set_founder_project_files_updated_at on public.founder_project_files;

create trigger set_founder_project_files_updated_at
before update on public.founder_project_files
for each row
execute function public.set_updated_at();

alter table public.founder_project_files enable row level security;

drop policy if exists "Users can read their own project files" on public.founder_project_files;
create policy "Users can read their own project files"
on public.founder_project_files
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "Users can create their own project files" on public.founder_project_files;
create policy "Users can create their own project files"
on public.founder_project_files
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "Users can update their own project files" on public.founder_project_files;
create policy "Users can update their own project files"
on public.founder_project_files
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "Users can delete their own project files" on public.founder_project_files;
create policy "Users can delete their own project files"
on public.founder_project_files
for delete
to authenticated
using (owner_user_id = auth.uid());