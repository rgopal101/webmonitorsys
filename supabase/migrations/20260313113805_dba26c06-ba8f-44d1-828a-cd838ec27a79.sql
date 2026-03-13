
CREATE POLICY "Admins can upload to email-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update email-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
