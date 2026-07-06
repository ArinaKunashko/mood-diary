create table if not exists public.diary_entries (
  id uuid primary key,
  entry_date date not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diary_entries_entry_date_idx
  on public.diary_entries (entry_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists diary_entries_set_updated_at on public.diary_entries;

create trigger diary_entries_set_updated_at
before update on public.diary_entries
for each row
execute function public.set_updated_at();

alter table public.diary_entries enable row level security;

drop policy if exists "Anyone can read diary entries" on public.diary_entries;
drop policy if exists "Anyone can create diary entries" on public.diary_entries;
drop policy if exists "Anyone can update diary entries" on public.diary_entries;
drop policy if exists "Anyone can delete diary entries" on public.diary_entries;

create policy "Anyone can read diary entries"
on public.diary_entries
for select
to anon
using (true);

create policy "Anyone can create diary entries"
on public.diary_entries
for insert
to anon
with check (true);

create policy "Anyone can update diary entries"
on public.diary_entries
for update
to anon
using (true)
with check (true);

create policy "Anyone can delete diary entries"
on public.diary_entries
for delete
to anon
using (true);
