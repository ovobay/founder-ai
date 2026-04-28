alter table public.founder_builds
add column if not exists classification jsonb not null default '{}'::jsonb;

create index if not exists founder_builds_classification_gin_idx
on public.founder_builds using gin (classification);