-- Fix: previous migration failed because notifications was already in supabase_realtime.
-- This migration only enforces "locked categories" at the database level.

-- 1) Prevent creating new threads in locked categories (allow admins/moderators)
DROP POLICY IF EXISTS "Authenticated users can create threads" ON public.threads;
CREATE POLICY "Authenticated users can create threads"
ON public.threads
FOR INSERT
WITH CHECK (
  (
    auth.uid() = author_id
    AND (NOT is_user_banned(auth.uid()))
    AND (
      NOT COALESCE(
        (
          SELECT c.is_locked
          FROM public.categories c
          WHERE c.id = threads.category_id
        ),
        false
      )
    )
  )
  OR is_admin_or_mod(auth.uid())
);

-- 2) Prevent replying/creating posts in threads that belong to locked categories (allow admins/moderators)
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts"
ON public.posts
FOR INSERT
WITH CHECK (
  (
    auth.uid() = author_id
    AND (NOT is_user_banned(auth.uid()))
    AND (
      NOT EXISTS (
        SELECT 1
        FROM public.threads t
        JOIN public.categories c ON c.id = t.category_id
        WHERE t.id = posts.thread_id
          AND COALESCE(c.is_locked, false) = true
      )
    )
  )
  OR is_admin_or_mod(auth.uid())
);
