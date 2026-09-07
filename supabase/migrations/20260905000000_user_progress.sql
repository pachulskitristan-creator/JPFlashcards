-- One row per account, holding a JSON snapshot of everything the app
-- otherwise keeps in AsyncStorage (SRS progress, gamification/XP,
-- custom vocab, user tags). Guests never touch this table — sync only
-- kicks in once someone is signed in (see services/cloudSyncService.ts).
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  srs_store jsonb not null default '{}'::jsonb,
  gamification jsonb not null default '{}'::jsonb,
  custom_vocab jsonb not null default '[]'::jsonb,
  user_tags jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

create policy "select own progress" on public.user_progress
  for select using (auth.uid() = user_id);

create policy "insert own progress" on public.user_progress
  for insert with check (auth.uid() = user_id);

create policy "update own progress" on public.user_progress
  for update using (auth.uid() = user_id);

-- No delete policy for regular users: rows are removed server-side by
-- the delete-account Edge Function (service role bypasses RLS), which
-- runs before the auth user itself is deleted. The FK's ON DELETE
-- CASCADE is a second safety net either way.
