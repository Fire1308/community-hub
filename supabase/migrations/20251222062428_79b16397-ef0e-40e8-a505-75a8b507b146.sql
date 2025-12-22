-- Fix security issues found in the scan

-- 1. Add proper INSERT policy for notification_settings
DROP POLICY IF EXISTS "Users can manage their settings" ON public.notification_settings;
CREATE POLICY "Users can insert their own settings"
ON public.notification_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.notification_settings FOR UPDATE
USING (auth.uid() = user_id);

-- 2. Fix polls INSERT policy - only thread authors can create polls
DROP POLICY IF EXISTS "Thread authors can create polls" ON public.polls;
CREATE POLICY "Thread authors can create polls"
ON public.polls FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.threads 
    WHERE id = thread_id AND author_id = auth.uid()
  )
);

-- 3. Fix thread_tags - only thread authors and mods can manage
DROP POLICY IF EXISTS "Authenticated can manage thread tags" ON public.thread_tags;
CREATE POLICY "Thread authors and mods can manage tags"
ON public.thread_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.threads 
    WHERE id = thread_id AND (author_id = auth.uid() OR is_admin_or_mod(auth.uid()))
  )
);

-- 4. Fix user_badges - only system/admins can award badges
DROP POLICY IF EXISTS "System can award badges" ON public.user_badges;
CREATE POLICY "Admins can award badges"
ON public.user_badges FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. Add DELETE policy for notifications - users can delete their own
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- 6. Split bookmarks ALL policy into specific policies
DROP POLICY IF EXISTS "Users can manage their bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert their bookmarks"
ON public.bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their bookmarks"
ON public.bookmarks FOR DELETE
USING (auth.uid() = user_id);