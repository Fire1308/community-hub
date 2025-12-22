import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useGlobalChat() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const messagesRef = useRef<ChatMessage[]>([]);

  const messagesQuery = useQuery({
    queryKey: ['global-chat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_chat')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      const messages = (data || []) as unknown as ChatMessage[];
      messagesRef.current = messages;
      return messages;
    },
    enabled: !!user,
    staleTime: Infinity, // Don't refetch automatically, rely on realtime
  });

  // Real-time subscription with optimistic updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-chat-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_chat',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Check if this message already exists (from optimistic update)
          const existingMessages = queryClient.getQueryData<ChatMessage[]>(['global-chat']) || [];
          const exists = existingMessages.some(m => m.id === newMessage.id);
          
          if (!exists) {
            // Fetch the profile for this message
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, display_name, avatar_url')
              .eq('id', newMessage.user_id)
              .single();

            const messageWithProfile: ChatMessage = {
              ...newMessage,
              profiles: profileData,
            };

            // Add new message to cache
            queryClient.setQueryData<ChatMessage[]>(['global-chat'], (old = []) => {
              // Prevent duplicates
              if (old.some(m => m.id === messageWithProfile.id)) return old;
              return [...old, messageWithProfile];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('global_chat')
        .insert({
          user_id: user.id,
          message: message.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (message) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['global-chat'] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(['global-chat']);

      // Create optimistic message
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        user_id: user!.id,
        message: message.trim(),
        created_at: new Date().toISOString(),
        profiles: {
          username: profile?.username || 'You',
          display_name: profile?.display_name || profile?.username || 'You',
          avatar_url: profile?.avatar_url || null,
        },
      };

      // Optimistically add the message
      queryClient.setQueryData<ChatMessage[]>(['global-chat'], (old = []) => [
        ...old,
        optimisticMessage,
      ]);

      return { previousMessages, optimisticMessage };
    },
    onSuccess: (data, _, context) => {
      // Replace temp message with real one
      queryClient.setQueryData<ChatMessage[]>(['global-chat'], (old = []) => {
        return old.map(msg => 
          msg.id === context?.optimisticMessage.id 
            ? { ...data, profiles: context.optimisticMessage.profiles }
            : msg
        );
      });
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['global-chat'], context.previousMessages);
      }
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage,
  };
}

export function useBanStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ban-status', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
