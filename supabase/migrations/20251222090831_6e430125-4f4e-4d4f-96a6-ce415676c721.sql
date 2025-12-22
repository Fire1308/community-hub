
-- Create thread_follows table for users to follow/subscribe to threads
CREATE TABLE public.thread_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notify_on_reply BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- Enable RLS
ALTER TABLE public.thread_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own follows"
  ON public.thread_follows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow threads"
  ON public.thread_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow threads"
  ON public.thread_follows FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their follow settings"
  ON public.thread_follows FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_thread_view(p_thread_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE threads 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_thread_id;
END;
$$;
