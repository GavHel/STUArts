create table public.commission_notification_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null references public.commission_requests(id) on delete cascade,
  audience text not null check (audience in ('admin', 'artist')),
  read_at timestamptz not null default now(),
  primary key (user_id, audience, request_id)
);

alter table public.commission_notification_reads enable row level security;
revoke all on public.commission_notification_reads from public, anon, authenticated;
grant select, insert, update on public.commission_notification_reads to service_role;

create function public.unread_commission_notifications(
  target_user uuid,
  target_audience text,
  target_artist_slug text
)
returns table (
  request_id uuid,
  artist_slug text,
  medium text,
  created_at timestamptz,
  unread_count integer
)
language sql
stable
set search_path = ''
as $function$
  select request.id, request.artist_slug, request.medium, request.created_at,
         count(*) over ()::integer
  from public.commission_requests as request
  where (
    target_audience = 'admin'
    or (target_audience = 'artist' and request.artist_slug = target_artist_slug)
  )
  and not exists (
    select 1
    from public.commission_notification_reads as receipt
    where receipt.user_id = target_user
      and receipt.audience = target_audience
      and receipt.request_id = request.id
  )
  order by request.created_at desc, request.id desc
  limit 20;
$function$;

revoke all on function public.unread_commission_notifications(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.unread_commission_notifications(uuid, text, text)
  to service_role;
