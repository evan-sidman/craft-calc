-- Storage RLS policies for project-photos bucket
create policy "public can read photos"
  on storage.objects for select
  using (bucket_id = 'project-photos');

create policy "auth users can upload photos"
  on storage.objects for insert
  with check (
    bucket_id = 'project-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "auth users can delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'project-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
