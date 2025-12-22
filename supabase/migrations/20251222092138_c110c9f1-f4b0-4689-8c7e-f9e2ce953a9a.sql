-- Fix global_chat RLS policy to handle null cases properly
DROP POLICY IF EXISTS "Authenticated users can read global chat" ON public.global_chat;

CREATE POLICY "Authenticated users can read global chat"
ON public.global_chat
FOR SELECT
TO authenticated
USING (true);

-- Keep insert policy the same but fix for null check
DROP POLICY IF EXISTS "Authenticated non-banned users can send messages" ON public.global_chat;

CREATE POLICY "Authenticated non-banned users can send messages"
ON public.global_chat
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id) AND (NOT COALESCE(is_user_banned(auth.uid()), false)));