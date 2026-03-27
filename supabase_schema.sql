-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Projects ───────────────────────────────────────────────────────────────
create table projects (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  name                text not null default 'Новый проект',
  status              text not null default 'in_progress'
                        check (status in ('in_progress', 'done', 'sold', 'personal')),
  photo_url           text,
  planned_hours       numeric default 0,
  target_hourly_rate  numeric default 0,
  sale_price          numeric default 0,
  tax_percent         numeric default 6,
  product_title       text,
  product_description text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─── Materials ──────────────────────────────────────────────────────────────
create table materials (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references projects(id) on delete cascade not null,
  name           text default '',
  qty            numeric default 1,
  unit           text default 'шт',
  price_per_unit numeric default 0,
  created_at     timestamptz default now()
);

-- ─── Time sessions ──────────────────────────────────────────────────────────
create table time_sessions (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  date       date not null default current_date,
  start_time time,
  end_time   time,
  hours      numeric not null default 0,
  note       text default '',
  created_at timestamptz default now()
);

-- ─── Expenses ───────────────────────────────────────────────────────────────
create table expenses (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid references projects(id) on delete cascade not null unique,
  packaging           numeric default 0,
  shipping            numeric default 0,
  commission_percent  numeric default 0,
  promo               numeric default 0,
  items               jsonb default '[]'::jsonb,  -- [{id, label, amount}]
  updated_at          timestamptz default now()
);

-- ─── RLS (Row Level Security) ────────────────────────────────────────────────
alter table projects      enable row level security;
alter table materials     enable row level security;
alter table time_sessions enable row level security;
alter table expenses      enable row level security;

-- Users see only their own projects
create policy "users own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Materials, sessions, expenses — via project ownership
create policy "users own materials"
  on materials for all
  using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));

create policy "users own sessions"
  on time_sessions for all
  using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));

create policy "users own expenses"
  on expenses for all
  using (exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid()));

-- ─── Auto-set user_id on insert ─────────────────────────────────────────────
create or replace function set_user_id()
returns trigger as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger projects_set_user_id
  before insert on projects
  for each row execute function set_user_id();

-- ─── Storage bucket for photos ──────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket:
--   Name: project-photos
--   Public: true
--
-- Then add this policy in Storage → project-photos → Policies:
-- INSERT policy: (auth.uid()::text) = (storage.foldername(name))[1]
-- SELECT policy: true (public read)
