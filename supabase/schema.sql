-- MatMind — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- ── PROFILES ──────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                              uuid references auth.users on delete cascade primary key,
  full_name                       text,
  belt                            text default 'white',
  language                        text default 'en',
  time_format                     text default '24h',
  role                            text default 'user',
  subscription_plan               text default 'free',
  subscription_status             text default 'trial',
  trial_start_date                timestamptz default now(),
  trial_end_date                  timestamptz default (now() + interval '14 days'),
  custom_technique_categories     text default 'Try Next Class,Show Coach,Favorite',
  custom_training_categories      text default '',
  custom_belts                    text default 'white,blue,purple,brown,black',
  dashboard_visible_categories    text default 'Try Next Class',
  show_only_next_training_techniques boolean default false,
  notifications_enabled           boolean default true,
  notification_minutes_before     int default 30,
  gym_id                          text,
  created_at                      timestamptz default now(),
  updated_at                      timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── TECHNIQUES ────────────────────────────────────────────────────
create table if not exists public.techniques (
  id                uuid default gen_random_uuid() primary key,
  title             text not null,
  video_url         text,
  thumbnail_url     text,
  source_platform   text,
  category          text,
  notes             text,
  tags              text,
  training_id       uuid,
  created_by        uuid references auth.users on delete cascade not null,
  shared_by_gym_id  text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.techniques enable row level security;

create policy "Users can manage own techniques"
  on public.techniques for all
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- ── TRAININGS ─────────────────────────────────────────────────────
create table if not exists public.trainings (
  id          uuid default gen_random_uuid() primary key,
  day_of_week text,
  time        text,
  instructor  text,
  category    text,
  notes       text,
  created_by  uuid references auth.users on delete cascade not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.trainings enable row level security;

create policy "Users can manage own trainings"
  on public.trainings for all
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);
