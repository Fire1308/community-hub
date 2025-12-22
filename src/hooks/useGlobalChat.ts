import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient, useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
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

const MESSAGES_PER_PAGE = 50;

export function useGlobalChat() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const pendingMessageId = useRef<string | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const messagesQuery = useInfiniteQuery({
    queryKey: ['global-chat'],
    queryFn: async ({ pageParam = 0 }) => {
      // Fetch messages first
      const { data: messagesData, error } = await supabase
        .from('global_chat')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + MESSAGES_PER_PAGE - 1);

      if (error) throw error;
      
      if (!messagesData || messagesData.length === 0) {
        return {
          messages: [] as ChatMessage[],
          nextPage: null,
        };
      }

      // Fetch profiles separately
      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const messagesWithProfiles: ChatMessage[] = messagesData.map(msg => ({
        ...msg,
        profiles: profileMap.get(msg.user_id) || undefined,
      }));
      
      return {
        messages: messagesWithProfiles.reverse(),
        nextPage: messagesData.length === MESSAGES_PER_PAGE ? pageParam + MESSAGES_PER_PAGE : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user,
    staleTime: Infinity,
    initialPageParam: 0,
  });

  // Flatten all pages into single array
  const messages = messagesQuery.data?.pages.flatMap(page => page.messages) || [];

  // Real-time subscription - FIXED to prevent duplicates
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
          
          // If this is from current user, it was already added optimistically
          if (newMessage.user_id === user.id) {
            return;
          }
          
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
          queryClient.setQueryData(['global-chat'], (old: any) => {
            if (!old) return old;
            
            // Check if message already exists
            const allMessages = old.pages.flatMap((p: any) => p.messages);
            if (allMessages.some((m: ChatMessage) => m.id === messageWithProfile.id)) return old;
            
            const newPages = [...old.pages];
            const lastPageIndex = newPages.length - 1;
            newPages[lastPageIndex] = {
              ...newPages[lastPageIndex],
              messages: [...newPages[lastPageIndex].messages, messageWithProfile],
            };
            return { ...old, pages: newPages };
          });
          
          setShouldScrollToBottom(true);
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
      setShouldScrollToBottom(true);
      await queryClient.cancelQueries({ queryKey: ['global-chat'] });

      const previousData = queryClient.getQueryData(['global-chat']);
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      pendingMessageId.current = tempId;

      const optimisticMessage: ChatMessage = {
        id: tempId,
        user_id: user!.id,
        message: message.trim(),
        created_at: new Date().toISOString(),
        profiles: {
          username: profile?.username || 'You',
          display_name: profile?.display_name || profile?.username || 'You',
          avatar_url: profile?.avatar_url || null,
        },
      };

      queryClient.setQueryData(['global-chat'], (old: any) => {
        if (!old) return { pages: [{ messages: [optimisticMessage], nextPage: null }], pageParams: [0] };
        
        const newPages = [...old.pages];
        const lastPageIndex = newPages.length - 1;
        newPages[lastPageIndex] = {
          ...newPages[lastPageIndex],
          messages: [...newPages[lastPageIndex].messages, optimisticMessage],
        };
        return { ...old, pages: newPages };
      });

      return { previousData, tempId };
    },
    onSuccess: (data, _, context) => {
      // Replace temp message with real one
      queryClient.setQueryData(['global-chat'], (old: any) => {
        if (!old) return old;
        
        const newPages = old.pages.map((page: any) => ({
          ...page,
          messages: page.messages.map((msg: ChatMessage) =>
            msg.id === context?.tempId 
              ? { ...data, profiles: { username: profile?.username, display_name: profile?.display_name, avatar_url: profile?.avatar_url } }
              : msg
          ),
        }));
        return { ...old, pages: newPages };
      });
      
      pendingMessageId.current = null;
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['global-chat'], context.previousData);
      }
      pendingMessageId.current = null;
    },
  });

  return {
    messages,
    isLoading: messagesQuery.isLoading,
    sendMessage,
    hasNextPage: messagesQuery.hasNextPage,
    fetchNextPage: messagesQuery.fetchNextPage,
    isFetchingNextPage: messagesQuery.isFetchingNextPage,
    shouldScrollToBottom,
    setShouldScrollToBottom,
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
