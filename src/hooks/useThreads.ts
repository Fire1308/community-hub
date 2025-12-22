import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Thread, Post } from '@/lib/supabase-types';

interface CreateThreadInput {
  title: string;
  category_id: string;
  content: string;
  tags?: string[];
}

export function useThreads(options?: {
  categoryId?: string;
  authorId?: string;
  search?: string;
  filter?: 'latest' | 'trending' | 'unanswered';
  limit?: number;
}) {
  const { categoryId, authorId, search, filter = 'latest', limit = 20 } = options || {};

  return useQuery({
    queryKey: ['threads', { categoryId, authorId, search, filter, limit }],
    queryFn: async () => {
      const { data: threads, error } = await supabase
        .from('threads')
        .select(`
          *,
          category:categories(id, name, slug, color, icon)
        `)
        .limit(limit)
        .order(
          filter === 'trending' ? 'view_count' : 
          filter === 'unanswered' ? 'created_at' : 'last_activity_at', 
          { ascending: false }
        );

      if (categoryId) {
        const { data: filteredThreads, error: filteredError } = await supabase
          .from('threads')
          .select(`*, category:categories(id, name, slug, color, icon)`)
          .eq('category_id', categoryId)
          .order('is_pinned', { ascending: false })
          .order('last_activity_at', { ascending: false })
          .limit(limit);
        
        if (filteredError) throw filteredError;
        
        // Fetch authors
        const authorIds = [...new Set(filteredThreads?.map(t => t.author_id) || [])];
        const { data: authors } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', authorIds);

        return (filteredThreads || []).map(thread => ({
          ...thread,
          author: authors?.find(a => a.id === thread.author_id) || null,
        })) as unknown as Thread[];
      }

      if (error) throw error;

      // Fetch authors for all threads
      const authorIds = [...new Set(threads?.map(t => t.author_id) || [])];
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', authorIds);

      return (threads || []).map(thread => ({
        ...thread,
        author: authors?.find(a => a.id === thread.author_id) || null,
      })) as unknown as Thread[];
    },
  });
}

export function useThread(slugOrId: string) {
  return useQuery({
    queryKey: ['thread', slugOrId],
    queryFn: async () => {
      // Check if it's a UUID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      
      let query = supabase
        .from('threads')
        .select(`
          *,
          category:categories(id, name, slug, color, icon)
        `);
      
      if (isUUID) {
        query = query.eq('id', slugOrId);
      } else {
        query = query.eq('slug', slugOrId);
      }

      const { data: thread, error } = await query.maybeSingle();
      
      if (error) throw error;
      if (!thread) return null;
      
      // Fetch author profile separately (since author_id references auth.users, not profiles)
      const { data: author } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, reputation_points')
        .eq('id', thread.author_id)
        .maybeSingle();

      // Increment view count in background
      supabase.rpc('increment_thread_view', { p_thread_id: thread.id }).then();
      
      return { ...thread, author } as unknown as Thread;
    },
    enabled: !!slugOrId,
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateThreadInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .insert({
          title: input.title,
          slug: `${slug}-${Date.now()}`,
          category_id: input.category_id,
          author_id: user.id,
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Create first post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          thread_id: thread.id,
          author_id: user.id,
          content: input.content,
        });

      if (postError) throw postError;

      // Add tags if provided
      if (input.tags && input.tags.length > 0) {
        for (const tagId of input.tags) {
          await supabase
            .from('thread_tags')
            .insert({
              thread_id: thread.id,
              tag_id: tagId,
            });
        }
      }

      return thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
}

export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Thread> }) => {
      const { data, error } = await supabase
        .from('threads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['thread', id] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('threads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
}
