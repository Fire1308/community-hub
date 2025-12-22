import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Thread } from '@/lib/supabase-types';

export function usePinnedThreads(categoryId?: string) {
  return useQuery({
    queryKey: ['pinned-threads', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('threads')
        .select(`
          *,
          category:categories(id, name, slug, color, icon)
        `)
        .eq('is_pinned', true)
        .order('last_activity_at', { ascending: false })
        .limit(10);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data: threads, error } = await query;

      if (error) throw error;
      if (!threads || threads.length === 0) return [];

      // Fetch authors
      const authorIds = [...new Set(threads.map(t => t.author_id))];
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', authorIds);

      return threads.map(thread => ({
        ...thread,
        author: authors?.find(a => a.id === thread.author_id) || null,
      })) as unknown as Thread[];
    },
  });
}
