-- Users profile (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  kids_ages integer[],  -- e.g. [3, 7] for kids aged 3 and 7
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view and edit their own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Saved activities
create table public.saved_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  place_id text not null,        -- Google Places place_id
  place_name text not null,
  place_address text,
  category text,
  saved_at timestamptz default now(),
  unique (user_id, place_id)
);

alter table public.saved_activities enable row level security;

create policy "Users can manage their own saved activities"
  on public.saved_activities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
