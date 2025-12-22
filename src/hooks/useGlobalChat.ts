import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['global-chat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_chat' as any)
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
      return (data || []) as unknown as ChatMessage[];
    },
    enabled: !!user,
  });

  // Real-time subscription
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
        () => {
          queryClient.invalidateQueries({ queryKey: ['global-chat'] });
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

      const { error } = await supabase
        .from('global_chat' as any)
        .insert({
          user_id: user.id,
          message: message.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-chat'] });
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
