create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 80),
  display_name text not null check (char_length(display_name) between 1 and 120),
  university text check (university is null or char_length(university) <= 160),
  program text check (program is null or char_length(program) <= 120),
  location text check (location is null or char_length(location) <= 120),
  bio text check (bio is null or char_length(bio) <= 3000),
  profile_image_url text check (profile_image_url is null or char_length(profile_image_url) <= 2048),
  graduation_year integer check (graduation_year is null or graduation_year between 2000 and 2200),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  medium text not null check (char_length(medium) between 1 and 80),
  description text check (description is null or char_length(description) <= 2000),
  image_url text not null check (char_length(image_url) between 1 and 2048),
  image_alt text not null check (char_length(image_alt) between 1 and 300),
  year integer check (year is null or year between 1800 and 2200),
  price_cad integer check (price_cad is null or price_cad between 0 and 1000000),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.commission_requests
  add column if not exists request_status text not null default 'new'
    check (request_status in ('new', 'in_review', 'accepted', 'declined', 'completed')),
  add column if not exists admin_notes text
    check (admin_notes is null or char_length(admin_notes) <= 2000),
  add column if not exists updated_at timestamptz not null default now();

alter table public.commission_requests
  drop constraint if exists commission_requests_artist_slug_check;

alter table public.commission_requests
  add constraint commission_requests_artist_slug_format
    check (artist_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(artist_slug) <= 80);

alter table public.artists enable row level security;
alter table public.artworks enable row level security;

revoke all on table public.artists, public.artworks from anon, authenticated;
grant select on table public.artists, public.artworks to anon, authenticated;
grant all on table public.artists, public.artworks to service_role;
grant select, update on table public.commission_requests to service_role;

create policy "Public can read published artists"
  on public.artists for select
  to anon, authenticated
  using (is_published);

create policy "Public can read published artwork from published artists"
  on public.artworks for select
  to anon, authenticated
  using (
    is_published
    and exists (
      select 1
      from public.artists
      where artists.id = artworks.artist_id
        and artists.is_published
    )
  );

create index if not exists artworks_artist_id_idx on public.artworks (artist_id);
create index if not exists commission_requests_status_created_at_idx
  on public.commission_requests (request_status, created_at desc);
