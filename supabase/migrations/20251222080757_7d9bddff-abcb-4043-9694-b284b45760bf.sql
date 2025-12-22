-- Create system_settings table for global theme settings (admin-only save)
CREATE TABLE public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by uuid REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read system settings"
ON public.system_settings FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Only admins can update system settings"
ON public.system_settings FOR UPDATE
TO authenticated
USING (public.is_admin_or_mod(auth.uid()));

-- Only admins can insert settings
CREATE POLICY "Only admins can insert system settings"
ON public.system_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_mod(auth.uid()));

-- Insert default theme settings
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES 
    ('forum_theme', '"default"'),
    ('festival_theme', '"none"');

-- Create global_chat table for real-time chat
CREATE TABLE public.global_chat (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.global_chat ENABLE ROW LEVEL SECURITY;

-- Authenticated non-banned users can read messages
CREATE POLICY "Authenticated users can read global chat"
ON public.global_chat FOR SELECT
TO authenticated
USING (NOT public.is_user_banned(auth.uid()));

-- Authenticated non-banned users can send messages
CREATE POLICY "Authenticated non-banned users can send messages"
ON public.global_chat FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_user_banned(auth.uid())
);

-- Enable realtime for global_chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat;

-- Create trigger for updated_at on system_settings
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();