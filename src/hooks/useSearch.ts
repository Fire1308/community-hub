import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Thread, Post, Profile } from '@/lib/supabase-types';

interface SearchResults {
  threads: Thread[];
  posts: Post[];
  users: Profile[];
}

export function useSearch(query: string, options?: {
  type?: 'all' | 'threads' | 'posts' | 'users';
  categoryId?: string;
  tagId?: string;
}) {
  const { type = 'all', categoryId, tagId } = options || {};

  return useQuery({
    queryKey: ['search', query, type, categoryId, tagId],
    queryFn: async (): Promise<SearchResults> => {
      const results: SearchResults = {
        threads: [],
        posts: [],
        users: [],
      };

      if (!query.trim()) return results;

      // Search threads
      if (type === 'all' || type === 'threads') {
        let threadsQuery = supabase
          .from('threads')
          .select(`
            *,
            author:profiles(*),
            category:categories(*)
          `)
          .textSearch('search_vector', query)
          .limit(20);

        if (categoryId) {
          threadsQuery = threadsQuery.eq('category_id', categoryId);
        }

        const { data: threads } = await threadsQuery;
        results.threads = (threads || []) as unknown as Thread[];
      }

      // Search posts
      if (type === 'all' || type === 'posts') {
        const { data: posts } = await supabase
          .from('posts')
          .select(`
            *,
            author:profiles(*)
          `)
          .textSearch('search_vector', query)
          .limit(20);

        results.posts = (posts || []) as unknown as Post[];
      }

      // Search users
      if (type === 'all' || type === 'users') {
        const { data: users } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(20);

        results.users = (users || []) as Profile[];
      }

      return results;
    },
    enabled: !!query.trim(),
  });
}
