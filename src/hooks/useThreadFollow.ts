import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// Increment view count when viewing a thread
export function useTrackThreadView(threadId: string | undefined) {
  useEffect(() => {
    if (!threadId) return;
    
    // Call the RPC function to increment view count
    const trackView = async () => {
      try {
        await supabase.rpc('increment_thread_view', { p_thread_id: threadId });
      } catch (e) {
        console.error('Failed to track view:', e);
      }
    };
    trackView();
  }, [threadId]);
}

// Check if user is following a thread
export function useIsFollowingThread(threadId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['thread-follow', threadId, user?.id],
    queryFn: async () => {
      if (!user || !threadId) return false;
      
      const { data } = await supabase
        .from('thread_follows')
        .select('id')
        .eq('thread_id', threadId)
        .eq('user_id', user.id)
        .single();
      
      return !!data;
    },
    enabled: !!user && !!threadId,
  });
}

// Toggle thread follow
export function useToggleThreadFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (threadId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check if already following
      const { data: existing } = await supabase
        .from('thread_follows')
        .select('id')
        .eq('thread_id', threadId)
        .eq('user_id', user.id)
        .single();
      
      if (existing) {
        // Unfollow
        await supabase
          .from('thread_follows')
          .delete()
          .eq('thread_id', threadId)
          .eq('user_id', user.id);
        return { action: 'unfollowed' };
      } else {
        // Follow
        await supabase
          .from('thread_follows')
          .insert({ thread_id: threadId, user_id: user.id });
        return { action: 'followed' };
      }
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['thread-follow', threadId] });
      queryClient.invalidateQueries({ queryKey: ['followed-threads'] });
    },
  });
}

// Get all threads user is following
export function useFollowedThreads() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['followed-threads', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('thread_follows')
        .select(`
          id,
          thread_id,
          notify_on_reply,
          created_at,
          thread:threads(
            id,
            title,
            slug,
            reply_count,
            last_activity_at,
            author:profiles!threads_author_id_fkey(username, avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// Get followers count for a thread
export function useThreadFollowersCount(threadId: string | undefined) {
  return useQuery({
    queryKey: ['thread-followers-count', threadId],
    queryFn: async () => {
      if (!threadId) return 0;
      
      const { count, error } = await supabase
        .from('thread_follows')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', threadId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!threadId,
  });
}
