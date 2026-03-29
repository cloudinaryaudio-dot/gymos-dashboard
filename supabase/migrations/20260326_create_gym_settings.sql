create table public.gym_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  gym_name text not null default 'My Gym',
  logo_url text,
  primary_color text not null default '142 71% 45%',
  secondary_color text not null default '220 25% 8%',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gym_settings enable row level security;

create policy "Users can view own settings" on public.gym_settings
  for select to authenticated using (user_id = auth.uid());

create policy "Users can insert own settings" on public.gym_settings
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update own settings" on public.gym_settings
  for update to authenticated using (user_id = auth.uid());

-- Allow public read for landing page branding
create policy "Public can read gym settings" on public.gym_settings
  for select to anon using (true);
