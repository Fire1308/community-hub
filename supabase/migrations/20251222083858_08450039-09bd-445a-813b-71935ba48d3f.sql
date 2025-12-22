-- Add online status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for online status queries
CREATE INDEX IF NOT EXISTS idx_profiles_online ON public.profiles(is_online, show_online_status);

-- Create function to update last_seen
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_seen update when is_online changes
DROP TRIGGER IF EXISTS update_profiles_last_seen ON public.profiles;
CREATE TRIGGER update_profiles_last_seen
BEFORE UPDATE OF is_online ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_last_seen();