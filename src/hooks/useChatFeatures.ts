import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TypingUser {
  user_id: string;
  username: string;
  display_name: string | null;
}

export function useTypingIndicator(chatType: 'global' | 'private', recipientId?: string) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Fetch current typers
  const { data: typingUsers = [] } = useQuery({
    queryKey: ['typing-indicators', chatType, recipientId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('typing_indicators')
        .select(`
          user_id,
          profiles:user_id (
            username,
            display_name
          )
        `)
        .eq('chat_type', chatType)
        .neq('user_id', user.id)
        .gt('updated_at', new Date(Date.now() - 10000).toISOString());

      if (chatType === 'private' && recipientId) {
        // For private chat, get typing status where we're the recipient
        query = query.eq('recipient_id', user.id);
      }

      const { data, error } = await query;
      if (error) return [];

      return (data || []).map((item: any) => ({
        user_id: item.user_id,
        username: item.profiles?.username || 'Unknown',
        display_name: item.profiles?.display_name,
      })) as TypingUser[];
    },
    enabled: !!user,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Real-time subscription for typing indicators
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`typing-${chatType}-${recipientId || 'global'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: chatType === 'private' && recipientId 
            ? `recipient_id=eq.${user.id}` 
            : `chat_type=eq.global`,
        },
        () => {
          queryClient.invalidateQueries({ 
            queryKey: ['typing-indicators', chatType, recipientId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, chatType, recipientId, queryClient]);

  // Set typing status
  const setTyping = useCallback(async () => {
    if (!user || isTypingRef.current) return;

    isTypingRef.current = true;

    try {
      // Upsert typing indicator
      await supabase
        .from('typing_indicators')
        .upsert({
          user_id: user.id,
          chat_type: chatType,
          recipient_id: recipientId || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,chat_type,recipient_id',
        });
    } catch (error) {
      // Ignore errors for typing indicators
    }

    // Clear after 3 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [user, chatType, recipientId]);

  // Stop typing
  const stopTyping = useCallback(async () => {
    if (!user) return;

    isTypingRef.current = false;

    try {
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('user_id', user.id)
        .eq('chat_type', chatType);
    } catch (error) {
      // Ignore errors
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [user, chatType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  return {
    typingUsers: typingUsers.filter(u => u.user_id !== user?.id),
    setTyping,
    stopTyping,
  };
}

// Reaction types
export const REACTION_TYPES = ['❤️', '👍', '👎', '😂', '😮', '😢', '🔥', '💯'];

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: string;
}

export function useChatReactions(messageId: string, chatType: 'global' | 'private') {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch reactions for a message
  const { data: reactions = [] } = useQuery({
    queryKey: ['chat-reactions', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('chat_type', chatType);

      if (error) return [];
      return data as Reaction[];
    },
    enabled: !!messageId,
    staleTime: 30000,
  });

  // Add reaction
  const addReaction = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_reactions')
        .insert({
          user_id: user.id,
          message_id: messageId,
          chat_type: chatType,
          reaction_type: reactionType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-reactions', messageId] });
    },
  });

  // Remove reaction
  const removeReaction = useMutation({
    mutationFn: async (reactionType: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_reactions')
        .delete()
        .eq('user_id', user.id)
        .eq('message_id', messageId)
        .eq('reaction_type', reactionType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-reactions', messageId] });
    },
  });

  // Toggle reaction
  const toggleReaction = async (reactionType: string) => {
    const userHasReaction = reactions.some(
      r => r.user_id === user?.id && r.reaction_type === reactionType
    );

    if (userHasReaction) {
      await removeReaction.mutateAsync(reactionType);
    } else {
      await addReaction.mutateAsync(reactionType);
    }
  };

  // Group reactions by type
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.reaction_type]) {
      acc[reaction.reaction_type] = [];
    }
    acc[reaction.reaction_type].push(reaction.user_id);
    return acc;
  }, {} as Record<string, string[]>);

  return {
    reactions,
    groupedReactions,
    toggleReaction,
    userReactions: reactions.filter(r => r.user_id === user?.id).map(r => r.reaction_type),
    isLoading: addReaction.isPending || removeReaction.isPending,
  };
}

// Hook to prefetch reactions for multiple messages
export function usePrefetchReactions(messageIds: string[], chatType: 'global' | 'private') {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (messageIds.length === 0) return;

    const fetchReactions = async () => {
      const { data } = await supabase
        .from('chat_reactions')
        .select('*')
        .in('message_id', messageIds)
        .eq('chat_type', chatType);

      if (data) {
        // Group by message_id and set in cache
        const byMessage = data.reduce((acc, reaction) => {
          if (!acc[reaction.message_id]) {
            acc[reaction.message_id] = [];
          }
          acc[reaction.message_id].push(reaction);
          return acc;
        }, {} as Record<string, Reaction[]>);

        Object.entries(byMessage).forEach(([msgId, reactions]) => {
          queryClient.setQueryData(['chat-reactions', msgId], reactions);
        });
      }
    };

    fetchReactions();
  }, [messageIds.join(','), chatType, queryClient]);
}
