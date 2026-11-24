alter table public.artists
  add column if not exists owner_user_id uuid unique
    references auth.users(id) on delete set null;

alter table public.commission_requests
  add column if not exists customer_user_id uuid
    references auth.users(id) on delete set null,
  add column if not exists artist_response text
    check (artist_response is null or char_length(artist_response) <= 2000),
  add column if not exists artist_responded_at timestamptz;

create or replace function public.current_user_owns_artist(target_artist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.artists
    where id = target_artist_id
      and owner_user_id = (select auth.uid())
  );
$function$;

create or replace function public.current_user_owns_artist_slug(target_artist_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.artists
    where slug = target_artist_slug
      and owner_user_id = (select auth.uid())
  );
$function$;

create or replace function public.current_user_owns_commission_request(target_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.commission_requests
    where id = target_request_id
      and customer_user_id = (select auth.uid())
  );
$function$;

revoke all on function public.current_user_owns_artist(uuid) from public, anon;
revoke all on function public.current_user_owns_artist_slug(text) from public, anon;
revoke all on function public.current_user_owns_commission_request(uuid) from public, anon;
grant execute on function public.current_user_owns_artist(uuid) to authenticated;
grant execute on function public.current_user_owns_artist_slug(text) to authenticated;
grant execute on function public.current_user_owns_commission_request(uuid) to authenticated;

revoke select on table public.artists from anon, authenticated;
grant select (
  id, slug, display_name, university, program, location, bio,
  profile_image_url, graduation_year, is_published, created_at, updated_at
) on table public.artists to anon;
grant select (
  id, slug, display_name, university, program, location, bio,
  profile_image_url, graduation_year, is_published,
  created_at, updated_at
) on table public.artists to authenticated;
grant update (
  display_name, university, program, location, bio,
  profile_image_url, graduation_year, updated_at
) on table public.artists to authenticated;

grant insert (
  artist_id, title, medium, description, image_url, image_alt, year, price_cad
) on table public.artworks to authenticated;
grant update (
  title, medium, description, image_url, image_alt, year, price_cad, updated_at
) on table public.artworks to authenticated;

revoke all on table public.commission_requests from anon, authenticated;
grant select (
  id, artist_slug, medium, placement, project_brief, width, height, units,
  scale_guide, inspiration_url, requested_delivery_date, requester_name,
  requester_email, estimated_materials_cad, estimated_artist_fee_cad,
  estimated_total_cad, estimated_studio_time, request_status, artist_response,
  artist_responded_at, created_at, updated_at
) on table public.commission_requests to authenticated;
grant update (
  request_status, artist_response, artist_responded_at, updated_at
) on table public.commission_requests to authenticated;

create policy "Artist owners can read their profiles"
  on public.artists for select
  to authenticated
  using (public.current_user_owns_artist(id));

create policy "Artist owners can update their profiles"
  on public.artists for update
  to authenticated
  using (public.current_user_owns_artist(id))
  with check (public.current_user_owns_artist(id));

create policy "Artist owners can read their artwork"
  on public.artworks for select
  to authenticated
  using (public.current_user_owns_artist(artist_id));

create policy "Artist owners can add artwork"
  on public.artworks for insert
  to authenticated
  with check (public.current_user_owns_artist(artist_id));

create policy "Artist owners can update their artwork"
  on public.artworks for update
  to authenticated
  using (public.current_user_owns_artist(artist_id))
  with check (public.current_user_owns_artist(artist_id));

create policy "Customers can read their commission requests"
  on public.commission_requests for select
  to authenticated
  using (public.current_user_owns_commission_request(id));

create policy "Artists can read assigned commission requests"
  on public.commission_requests for select
  to authenticated
  using (public.current_user_owns_artist_slug(artist_slug));

create policy "Artists can respond to assigned commission requests"
  on public.commission_requests for update
  to authenticated
  using (public.current_user_owns_artist_slug(artist_slug))
  with check (public.current_user_owns_artist_slug(artist_slug));

create index if not exists commission_requests_customer_created_at_idx
  on public.commission_requests (customer_user_id, created_at desc);
create index if not exists commission_requests_artist_created_at_idx
  on public.commission_requests (artist_slug, created_at desc);
