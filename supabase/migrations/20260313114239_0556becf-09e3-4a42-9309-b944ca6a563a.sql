DROP POLICY IF EXISTS "Admins can upload to email-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update email-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read email-assets objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload email-assets objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update email-assets objects" ON storage.objects;

CREATE POLICY "Admins can read email-assets objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'email-assets'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Admins can upload email-assets objects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-assets'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Admins can update email-assets objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'email-assets'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::public.app_role
  )
)
WITH CHECK (
  bucket_id = 'email-assets'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::public.app_role
  )
);