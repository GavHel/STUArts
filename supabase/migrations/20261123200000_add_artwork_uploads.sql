insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stuarts-artwork-uploads',
  'stuarts-artwork-uploads',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1
    from storage.buckets
    where id = 'stuarts-artwork-uploads'
      and (
        public is distinct from false
        or file_size_limit is distinct from 5242880
        or allowed_mime_types is distinct from array['image/jpeg', 'image/png', 'image/webp']
      )
  ) then
    raise exception 'The stuarts-artwork-uploads bucket already exists with different settings. Review it before continuing.';
  end if;
end
$$;
