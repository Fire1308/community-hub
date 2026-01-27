import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Thread } from '@/lib/supabase-types';

interface UseInfiniteThreadsOptions {
  categoryId?: string;
  authorId?: string;
  filter?: 'latest' | 'trending' | 'unanswered';
  pageSize?: number;
}

export function useInfiniteThreads(options?: UseInfiniteThreadsOptions) {
  const { categoryId, authorId, filter = 'latest', pageSize = 10 } = options || {};
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['infinite-threads', { categoryId, authorId, filter }],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('threads')
        .select(`
          *,
          category:categories(id, name, slug, color, icon)
        `, { count: 'exact' });

      if (categoryId) {
        query = query.eq('category_id', categoryId)
          .order('is_pinned', { ascending: false })
          .order('last_activity_at', { ascending: false });
      } else if (authorId) {
        query = query.eq('author_id', authorId)
          .order('created_at', { ascending: false });
      } else {
        query = query.order(
          filter === 'trending' ? 'view_count' : 
          filter === 'unanswered' ? 'created_at' : 'last_activity_at', 
          { ascending: false }
        );
      }

      if (filter === 'unanswered') {
        query = query.eq('reply_count', 0);
      }

      query = query.range(pageParam, pageParam + pageSize - 1);

      const { data: threads, error, count } = await query;

      if (error) throw error;

      // Fetch authors
      const authorIds = [...new Set(threads?.map(t => t.author_id) || [])];
      let authors: any[] = [];
      if (authorIds.length > 0) {
        const { data: authorsData } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', authorIds);
        authors = authorsData || [];
      }

      const threadsWithAuthors = (threads || []).map(thread => ({
        ...thread,
        author: authors?.find(a => a.id === thread.author_id) || null,
      })) as unknown as Thread[];

      return {
        threads: threadsWithAuthors,
        total: count || 0,
        nextCursor: threads && threads.length === pageSize ? pageParam + pageSize : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ 
      queryKey: ['infinite-threads', { categoryId, authorId, filter }] 
    });
  };

  // Flatten all pages into single array
  const allThreads = query.data?.pages.flatMap(page => page.threads) || [];
  const total = query.data?.pages[0]?.total || 0;

  return {
    ...query,
    threads: allThreads,
    total,
    refresh,
  };
}
