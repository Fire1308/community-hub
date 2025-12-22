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
      let query = supabase
        .from('threads')
        .select(`
          *,
          author:profiles(*),
          category:categories(*)
        `)
        .limit(limit);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (authorId) {
        query = query.eq('author_id', authorId);
      }

      if (search) {
        query = query.textSearch('search_vector', search);
      }

      switch (filter) {
        case 'trending':
          query = query.order('view_count', { ascending: false });
          break;
        case 'unanswered':
          query = query.eq('reply_count', 0).order('created_at', { ascending: false });
          break;
        default:
          query = query.order('is_pinned', { ascending: false }).order('last_activity_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as unknown as Thread[];
    },
  });
}

export function useThread(threadId: string) {
  return useQuery({
    queryKey: ['thread', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          author:profiles(*),
          category:categories(*)
        `)
        .eq('id', threadId)
        .single();
      
      if (error) throw error;
      
      // Increment view count
      supabase
        .from('threads')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', threadId)
        .then();
      
      return data as unknown as Thread;
    },
    enabled: !!threadId,
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
