-- Create post-media bucket
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do update set public = true;

-- Drop existing policies if they exist (for idempotency)
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Auth Upload" on storage.objects;
drop policy if exists "Auth Update" on storage.objects;
drop policy if exists "Auth Delete" on storage.objects;

-- RLS Policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'post-media' );

create policy "Auth Upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-media' and
    (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Auth Update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-media' and
    (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Auth Delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-media' and
    (storage.foldername(name))[2] = auth.uid()::text
  );
