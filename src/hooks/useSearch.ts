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

      // Search threads using ILIKE instead of textSearch for better compatibility
      if (type === 'all' || type === 'threads') {
        let threadsQuery = supabase
          .from('threads')
          .select(`
            *,
            category:categories(id, name, slug, color, icon)
          `)
          .ilike('title', `%${query}%`)
          .limit(20);

        if (categoryId) {
          threadsQuery = threadsQuery.eq('category_id', categoryId);
        }

        const { data: threads } = await threadsQuery;
        
        if (threads && threads.length > 0) {
          // Fetch authors separately
          const authorIds = [...new Set(threads.map(t => t.author_id))];
          const { data: authors } = await supabase
            .from('profiles')
            .select('*')
            .in('id', authorIds);
          
          const authorMap = new Map(authors?.map(a => [a.id, a]) || []);
          
          results.threads = threads.map(thread => ({
            ...thread,
            author: authorMap.get(thread.author_id) || null,
          })) as unknown as Thread[];
        }
      }

      // Search posts using ILIKE
      if (type === 'all' || type === 'posts') {
        const { data: posts } = await supabase
          .from('posts')
          .select('*')
          .ilike('content', `%${query}%`)
          .limit(20);

        if (posts && posts.length > 0) {
          // Fetch authors separately
          const authorIds = [...new Set(posts.map(p => p.author_id))];
          const { data: authors } = await supabase
            .from('profiles')
            .select('*')
            .in('id', authorIds);
          
          const authorMap = new Map(authors?.map(a => [a.id, a]) || []);
          
          results.posts = posts.map(post => ({
            ...post,
            author: authorMap.get(post.author_id) || null,
          })) as unknown as Post[];
        }
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
