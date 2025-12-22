import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTrendingThreads(limit = 5) {
  return useQuery({
    queryKey: ['trending-threads', limit],
    queryFn: async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Get threads with most activity in last 24 hours
      const { data: recentPosts, error: postsError } = await supabase
        .from('posts')
        .select('thread_id')
        .gte('created_at', oneDayAgo);

      if (postsError) throw postsError;

      // Count posts per thread
      const threadCounts: Record<string, number> = {};
      recentPosts?.forEach(post => {
        threadCounts[post.thread_id] = (threadCounts[post.thread_id] || 0) + 1;
      });

      // Sort by count and get top thread IDs
      const topThreadIds = Object.entries(threadCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);

      if (topThreadIds.length === 0) {
        // Fallback to recent threads if no activity
        const { data: fallbackThreads, error: fallbackError } = await supabase
          .from('threads')
          .select(`
            *,
            category:categories(name, slug, color)
          `)
          .order('last_activity_at', { ascending: false })
          .limit(limit);

        if (fallbackError) throw fallbackError;
        
        // Fetch authors separately
        const authorIds = [...new Set(fallbackThreads?.map(t => t.author_id) || [])];
        const { data: authors } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', authorIds);

        return fallbackThreads?.map(t => ({
          ...t,
          author: authors?.find(a => a.id === t.author_id) || null,
          recentPostCount: 0,
        })) || [];
      }

      // Fetch thread details
      const { data: threads, error: threadsError } = await supabase
        .from('threads')
        .select(`
          *,
          category:categories(name, slug, color)
        `)
        .in('id', topThreadIds);

      if (threadsError) throw threadsError;

      // Fetch authors separately
      const authorIds = [...new Set(threads?.map(t => t.author_id) || [])];
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', authorIds);

      // Sort by activity count and add count to each thread
      return (threads || [])
        .map(thread => ({
          ...thread,
          author: authors?.find(a => a.id === thread.author_id) || null,
          recentPostCount: threadCounts[thread.id] || 0,
        }))
        .sort((a, b) => b.recentPostCount - a.recentPostCount);
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
