import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OnlineUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  online_at: string;
}

export function useOnlineUsers() {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user?.id || 'anonymous',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            if (presence.id && !users.find(u => u.id === presence.id)) {
              users.push({
                id: presence.id,
                username: presence.username,
                display_name: presence.display_name,
                avatar_url: presence.avatar_url,
                online_at: presence.online_at,
              });
            }
          });
        });
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user && profile) {
          await channel.track({
            id: user.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  return { onlineUsers, count: onlineUsers.length };
}
