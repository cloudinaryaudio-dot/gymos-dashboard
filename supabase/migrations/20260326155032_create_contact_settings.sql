create table public.contact_settings (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null,
  whatsapp_number text,
  whatsapp_message text default 'Hi! I am interested in joining your gym.',
  instagram_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(gym_id)
);

alter table public.contact_settings enable row level security;

create policy "Anyone can read contact_settings"
  on public.contact_settings for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert their own contact_settings"
  on public.contact_settings for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update their own contact_settings"
  on public.contact_settings for update
  to authenticated
  using (true)
  with check (true);
