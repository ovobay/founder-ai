create or replace function public.enforce_founder_build_project_owner()
returns trigger
language plpgsql
as $$
declare
  project_owner uuid;
begin
  select owner_user_id
  into project_owner
  from public.founder_projects
  where id = new.project_id;

  if project_owner is null then
    raise exception 'Founder build project does not exist.';
  end if;

  if new.owner_user_id <> project_owner then
    raise exception 'Founder build owner_user_id must match founder project owner_user_id.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_founder_build_project_owner_insert_update
on public.founder_builds;

create trigger enforce_founder_build_project_owner_insert_update
before insert or update of project_id, owner_user_id
on public.founder_builds
for each row
execute function public.enforce_founder_build_project_owner();


create or replace function public.enforce_founder_project_file_ownership()
returns trigger
language plpgsql
as $$
declare
  project_owner uuid;
  build_project_id uuid;
  build_owner_user_id uuid;
begin
  select owner_user_id
  into project_owner
  from public.founder_projects
  where id = new.project_id;

  if project_owner is null then
    raise exception 'Founder project file project does not exist.';
  end if;

  if new.owner_user_id <> project_owner then
    raise exception 'Founder project file owner_user_id must match founder project owner_user_id.';
  end if;

  if new.last_build_id is not null then
    select project_id, owner_user_id
    into build_project_id, build_owner_user_id
    from public.founder_builds
    where id = new.last_build_id;

    if build_project_id is null then
      raise exception 'Founder project file last_build_id does not exist.';
    end if;

    if build_project_id <> new.project_id then
      raise exception 'Founder project file last_build_id must belong to the same project.';
    end if;

    if build_owner_user_id <> new.owner_user_id then
      raise exception 'Founder project file last_build_id must belong to the same owner.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_founder_project_file_ownership_insert_update
on public.founder_project_files;

create trigger enforce_founder_project_file_ownership_insert_update
before insert or update of project_id, owner_user_id, last_build_id
on public.founder_project_files
for each row
execute function public.enforce_founder_project_file_ownership();


drop policy if exists "Users can read their own builds" on public.founder_builds;
create policy "Users can read their own builds"
on public.founder_builds
for select
to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.founder_projects
    where founder_projects.id = founder_builds.project_id
      and founder_projects.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can create their own builds" on public.founder_builds;
create policy "Users can create their own builds"
on public.founder_builds
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.founder_projects
    where founder_projects.id = founder_builds.project_id
      and founder_projects.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own builds" on public.founder_builds;
create policy "Users can update their own builds"
on public.founder_builds
for update
to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.founder_projects
    where founder_projects.id = founder_builds.project_id
      and founder_projects.owner_user_id = auth.uid()
  )
)
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.founder_projects
    where founder_projects.id = founder_builds.project_id
      and founder_projects.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own builds" on public.founder_builds;
create policy "Users can delete their own builds"
on public.founder_builds
for delete
to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.founder_projects
    where founder_projects.id = founder_builds.project_id
      and founder_projects.owner_user_id = auth.uid()
  )
);


drop policy if exists "Users can read their own project files" on public.founder_project_files;
create policy "Users can read their own project files"
on public.founder_project_files
for select
to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.founder_projects
    where founder_projects.id = founder_project_files.project_id
      and founder_projects.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can create their own project files" on public.founder_project_files;
create policy "Users can create their own project files"
on public.founder_project_files
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.founder_projects
    where founder_projects.id = founder_project_files.project_id
      and founder_projects.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own project files" on public.founder_project_files;
create policy "Users can update their own project files"
on public.founder_project_files
for update
to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.founder_projects
    where founder_projects.id = founder_project_files.project_id
      and founder_projects.owner_user_id = auth.uid()
  )
)
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.founder_projects
    where founder_projects.id = founder_project_files.project_id
      and founder_projects.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own project files" on public.founder_project_files;
create policy "Users can delete their own project files"
on public.founder_project_files
for delete
to authenticated
using (
  owner_user_id = auth.uid()
  and exists (
    select 1
    from public.founder_projects
    where founder_projects.id = founder_project_files.project_id
      and founder_projects.owner_user_id = auth.uid()
  )
);
