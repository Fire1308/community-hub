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
  tagSlug?: string;
}) {
  const { type = 'all', categoryId, tagSlug } = options || {};

  return useQuery({
    queryKey: ['search', query, type, categoryId, tagSlug],
    queryFn: async (): Promise<SearchResults> => {
      const results: SearchResults = {
        threads: [],
        posts: [],
        users: [],
      };

      // If searching by tag, find threads with that tag
      if (tagSlug) {
        // First get the tag id
        const { data: tag } = await supabase
          .from('tags')
          .select('id')
          .eq('slug', tagSlug)
          .single();

        if (tag) {
          // Get thread ids with this tag
          const { data: threadTags } = await supabase
            .from('thread_tags')
            .select('thread_id')
            .eq('tag_id', tag.id);

          if (threadTags && threadTags.length > 0) {
            const threadIds = threadTags.map(tt => tt.thread_id);
            
            const { data: threads } = await supabase
              .from('threads')
              .select(`
                *,
                category:categories(id, name, slug, color, icon)
              `)
              .in('id', threadIds)
              .order('created_at', { ascending: false })
              .limit(50);

            if (threads && threads.length > 0) {
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
        }
        
        return results;
      }

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
    enabled: !!query.trim() || !!tagSlug,
  });
}
