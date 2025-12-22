-- Create typing_indicators table for real-time typing status
CREATE TABLE public.typing_indicators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  chat_type text NOT NULL CHECK (chat_type IN ('global', 'private')),
  recipient_id uuid, -- NULL for global chat, recipient's user_id for private
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_typing_indicators_chat ON public.typing_indicators(chat_type, recipient_id);
CREATE INDEX idx_typing_indicators_updated ON public.typing_indicators(updated_at);

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own typing status"
ON public.typing_indicators
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view typing indicators"
ON public.typing_indicators
FOR SELECT
USING (
  chat_type = 'global' OR 
  recipient_id = auth.uid() OR 
  user_id = auth.uid()
);

-- Auto-delete old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION public.cleanup_old_typing_indicators()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.typing_indicators 
  WHERE updated_at < now() - interval '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Create chat_reactions table for message reactions
CREATE TABLE public.chat_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  message_id uuid NOT NULL,
  chat_type text NOT NULL CHECK (chat_type IN ('global', 'private')),
  reaction_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id, reaction_type)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_chat_reactions_message ON public.chat_reactions(message_id, chat_type);
CREATE INDEX idx_chat_reactions_user ON public.chat_reactions(user_id);

-- Enable RLS
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for chat_reactions
CREATE POLICY "Users can add reactions"
ON public.chat_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
ON public.chat_reactions
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reactions"
ON public.chat_reactions
FOR SELECT
USING (true);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;