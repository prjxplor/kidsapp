-- Activity cache: stores API results by geohash cell + category
-- Geohash precision 6 = ~1.2km x 0.6km cells — good balance for neighborhood search
create table public.activity_cache (
  id uuid default gen_random_uuid() primary key,
  geohash text not null,          -- 6-char geohash of the search centre
  category text,                  -- null = all categories
  source text not null,           -- 'osm' | 'foursquare'
  activities jsonb not null,      -- full array of Activity objects
  fetched_at timestamptz default now(),
  unique (geohash, category, source)
);

-- Allow public read (no auth needed to search activities)
alter table public.activity_cache enable row level security;

create policy "Anyone can read activity cache"
  on public.activity_cache for select
  using (true);

-- Only server-side (service role) can write to cache
create policy "Service role can write cache"
  on public.activity_cache for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Index for fast geohash lookups
create index activity_cache_geohash_idx on public.activity_cache (geohash, category, source);
