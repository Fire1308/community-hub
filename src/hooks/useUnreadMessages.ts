import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadMessagesCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['unread-messages-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds as backup
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-messages-count', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export function useOnlineStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current user's online visibility setting
  const statusQuery = useQuery({
    queryKey: ['online-status-setting', user?.id],
    queryFn: async () => {
      if (!user) return { show_online_status: true, is_online: false };

      const { data, error } = await supabase
        .from('profiles')
        .select('show_online_status, is_online')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as { show_online_status: boolean; is_online: boolean };
    },
    enabled: !!user,
  });

  // Update online status on mount/unmount
  useEffect(() => {
    if (!user) return;

    // Set online
    supabase
      .from('profiles')
      .update({ is_online: true })
      .eq('id', user.id)
      .then();

    // Set offline on unmount
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
        JSON.stringify({ is_online: false })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Also update every minute to keep alive
    const interval = setInterval(() => {
      supabase
        .from('profiles')
        .update({ is_online: true })
        .eq('id', user.id)
        .then();
    }, 60000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
      // Set offline
      supabase
        .from('profiles')
        .update({ is_online: false })
        .eq('id', user.id)
        .then();
    };
  }, [user]);

  const toggleOnlineVisibility = async () => {
    if (!user) return;

    const newValue = !statusQuery.data?.show_online_status;
    
    await supabase
      .from('profiles')
      .update({ show_online_status: newValue })
      .eq('id', user.id);

    queryClient.invalidateQueries({ queryKey: ['online-status-setting', user.id] });
  };

  return {
    showOnlineStatus: statusQuery.data?.show_online_status ?? true,
    isOnline: statusQuery.data?.is_online ?? false,
    toggleOnlineVisibility,
    isLoading: statusQuery.isLoading,
  };
}
