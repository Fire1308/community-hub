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
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          *,
          thread:threads(
            *,
            author:profiles(*),
            category:categories(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Bookmark[];
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
