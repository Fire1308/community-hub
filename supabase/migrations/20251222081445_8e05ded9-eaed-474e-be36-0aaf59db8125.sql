-- Add forum layout style setting
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('forum_layout', '"social-timeline"')
ON CONFLICT (setting_key) DO NOTHING;

-- Add attachments support to global_chat
ALTER TABLE public.global_chat ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT NULL;

-- Create index for faster chat queries
CREATE INDEX IF NOT EXISTS idx_global_chat_created_at ON public.global_chat(created_at DESC);