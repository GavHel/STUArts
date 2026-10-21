create table if not exists public.commission_requests (
  id uuid primary key default gen_random_uuid(),
  artist_slug text not null default 'maya-linnea-chen'
    check (artist_slug = 'maya-linnea-chen'),
  medium text not null
    check (medium in ('Painting', 'Ceramics', 'Mixed media', 'Printmaking')),
  placement text not null
    check (placement in ('Living space', 'Office or studio', 'A thoughtful gift', 'Somewhere else')),
  project_brief text
    check (project_brief is null or char_length(project_brief) <= 2000),
  width numeric
    check (width is null or (width > 0 and width <= 200)),
  height numeric
    check (height is null or (height > 0 and height <= 200)),
  units text not null check (units in ('inches', 'centimeters')),
  scale_guide text
    check (scale_guide is null or scale_guide in (
      'Small — fits on a bookshelf',
      'Medium — about the size of a carry-on',
      'Large — makes a statement on the wall'
    )),
  inspiration_url text
    check (inspiration_url is null or char_length(inspiration_url) <= 2048),
  requested_delivery_date date,
  requester_name text not null
    check (char_length(requester_name) between 1 and 120),
  requester_email text not null
    check (char_length(requester_email) between 3 and 320),
  estimated_materials_cad integer not null
    check (estimated_materials_cad between 0 and 50000),
  estimated_artist_fee_cad integer not null
    check (estimated_artist_fee_cad between 0 and 50000),
  estimated_total_cad integer not null
    check (estimated_total_cad = estimated_materials_cad + estimated_artist_fee_cad),
  estimated_studio_time text not null
    check (estimated_studio_time in ('2—3 weeks', '3—4 weeks', '5—7 weeks')),
  created_at timestamptz not null default now(),
  constraint commission_dimensions_paired check (
    (width is null and height is null) or (width is not null and height is not null)
  ),
  constraint commission_size_required check (
    (width is not null and height is not null) or scale_guide is not null
  )
);

alter table public.commission_requests enable row level security;

revoke all on table public.commission_requests from anon, authenticated;
grant insert on table public.commission_requests to service_role;
