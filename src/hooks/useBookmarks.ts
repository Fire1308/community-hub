import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Bookmark } from '@/lib/supabase-types';
import { useAuth } from '@/contexts/AuthContext';

export function useBookmarks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: bookmarkRows, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookmarksError) throw bookmarksError;

      const rows = (bookmarkRows || []) as unknown as Bookmark[];
      const threadIds = Array.from(new Set(rows.map(b => b.thread_id).filter(Boolean)));
      if (threadIds.length === 0) return rows;

      // We can't join threads -> profiles directly because there is no FK relationship.
      // Fetch threads + categories, then fetch authors separately.
      const { data: threadRows, error: threadsError } = await supabase
        .from('threads')
        .select('*, category:categories(*)')
        .in('id', threadIds);

      if (threadsError) throw threadsError;

      const authorIds = Array.from(
        new Set((threadRows || []).map((t: any) => t.author_id).filter(Boolean))
      );

      let authorRows: any[] = [];
      if (authorIds.length > 0) {
        const { data: authors, error: authorsError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', authorIds);

        if (authorsError) throw authorsError;
        authorRows = authors || [];
      }

      const authorsById = new Map(authorRows.map(a => [a.id, a]));
      const threadsById = new Map(
        (threadRows || []).map((t: any) => [
          t.id,
          {
            ...t,
            author: authorsById.get(t.author_id) || null,
          },
        ])
      );

      return rows.map((b: any) => ({
        ...b,
        thread: threadsById.get(b.thread_id) || null,
      })) as unknown as Bookmark[];
    },
    enabled: !!user,
  });
}

export function useIsBookmarked(threadId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookmark', threadId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('thread_id', threadId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user && !!threadId,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (threadId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Check if bookmark exists
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('thread_id', threadId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { added: false };
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            thread_id: threadId,
            user_id: user.id,
          });
        if (error) throw error;
        return { added: true };
      }
    },
    onSuccess: (result, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', threadId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks', user?.id] });
    },
  });
}
