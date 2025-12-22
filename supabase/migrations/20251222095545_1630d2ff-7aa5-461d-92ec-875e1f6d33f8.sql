-- Create a storage bucket for app assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view app assets (public bucket)
CREATE POLICY "Anyone can view app assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-assets');

-- Allow admins to upload app assets
CREATE POLICY "Admins can upload app assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'app-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update app assets
CREATE POLICY "Admins can update app assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'app-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete app assets
CREATE POLICY "Admins can delete app assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'app-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);