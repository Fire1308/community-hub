import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Post, Reaction } from '@/lib/supabase-types';

interface CreatePostInput {
  thread_id: string;
  content: string;
  parent_post_id?: string;
}

export function usePosts(threadId: string, options?: { limit?: number; offset?: number }) {
  const { limit = 20, offset = 0 } = options || {};
  
  return useQuery({
    queryKey: ['posts', threadId, limit, offset],
    queryFn: async () => {
      // First get the thread ID if we have a slug
      let actualThreadId = threadId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId);
      
      if (!isUUID) {
        const { data: thread } = await supabase
          .from('threads')
          .select('id')
          .eq('slug', threadId)
          .maybeSingle();
        if (!thread) return { posts: [], total: 0 };
        actualThreadId = thread.id;
      }

      // Get total count
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', actualThreadId);

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('thread_id', actualThreadId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      if (!posts || posts.length === 0) return { posts: [], total: count || 0 };

      // Fetch authors separately
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, reputation_points')
        .in('id', authorIds);

      const postsWithAuthors = posts.map(post => ({
        ...post,
        author: authors?.find(a => a.id === post.author_id) || null,
      })) as unknown as Post[];

      return { posts: postsWithAuthors, total: count || 0 };
    },
    enabled: !!threadId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          thread_id: input.thread_id,
          author_id: user.id,
          content: input.content,
          parent_post_id: input.parent_post_id || null,
        })
        .select(`
          *,
          author:profiles(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { thread_id }) => {
      queryClient.invalidateQueries({ queryKey: ['posts', thread_id] });
      queryClient.invalidateQueries({ queryKey: ['thread', thread_id] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content, threadId }: { id: string; content: string; threadId: string }) => {
      const { data: existing } = await supabase
        .from('posts')
        .select('content, edit_history')
        .eq('id', id)
        .single();

      const editHistory = Array.isArray(existing?.edit_history) ? existing.edit_history : [];
      editHistory.push({
        content: existing?.content,
        edited_at: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from('posts')
        .update({
          content,
          is_edited: true,
          edit_history: editHistory,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, threadId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['posts', result.threadId] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, threadId }: { id: string; threadId: string }) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { threadId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['posts', result.threadId] });
    },
  });
}

export function usePostReactions(postId: string) {
  return useQuery({
    queryKey: ['reactions', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('post_id', postId);
      
      if (error) throw error;
      return data as Reaction[];
    },
    enabled: !!postId,
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if reaction exists
      const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          });
      }

      return { postId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['reactions', result.postId] });
    },
  });
}
