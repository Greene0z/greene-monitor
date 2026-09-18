-- Execute no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists daily_entries (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 date date not null, energy smallint check(energy between 1 and 5), mood smallint check(mood between 1 and 5),
 stress smallint check(stress between 1 and 5), focus smallint check(focus between 1 and 5),
 exercise boolean default false, reading boolean default false, study boolean default false, water boolean default false,
 organization boolean default false, social_control boolean default false, notes text, created_at timestamptz default now(),
 unique(user_id,date)
);
create table if not exists sleep_entries (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 date date not null, bed_time time not null, wake_time time not null, quality smallint check(quality between 1 and 5),
 awakenings integer default 0 check(awakenings>=0), notes text, created_at timestamptz default now(), unique(user_id,date)
);
create table if not exists books (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null, author text, status text not null default 'Quero ler', pages integer default 0, rating smallint check(rating between 1 and 5),
 notes text, created_at timestamptz default now()
);
create table if not exists studies (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 date date not null, subject text not null, minutes integer not null check(minutes>0), learned text, created_at timestamptz default now()
);
create table if not exists goals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 date date not null default current_date, title text not null, deadline date, progress integer default 0 check(progress between 0 and 100), created_at timestamptz default now()
);

alter table daily_entries enable row level security;
alter table sleep_entries enable row level security;
alter table books enable row level security;
alter table studies enable row level security;
alter table goals enable row level security;

do $$ declare t text;
begin
 foreach t in array array['daily_entries','sleep_entries','books','studies','goals'] loop
   execute format('drop policy if exists "own rows" on %I',t);
   execute format('create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',t);
 end loop;
end $$;