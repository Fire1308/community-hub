-- Fix search path for update_last_seen function
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;