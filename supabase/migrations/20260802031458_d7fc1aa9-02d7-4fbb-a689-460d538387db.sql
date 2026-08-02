CREATE POLICY "Users read their own chat photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload their own chat photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete their own chat photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-photos' AND auth.uid()::text = (storage.foldername(name))[1]);