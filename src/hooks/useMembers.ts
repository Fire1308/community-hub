import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MemberFilters {
  search?: string;
  sortBy?: 'reputation' | 'posts' | 'joined' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export function useMembers(filters: MemberFilters = {}) {
  const { search, sortBy = 'reputation', sortOrder = 'desc', limit = 20, offset = 0 } = filters;

  return useQuery({
    queryKey: ['members', filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      switch (sortBy) {
        case 'reputation':
          query = query.order('reputation_points', { ascending: sortOrder === 'asc', nullsFirst: false });
          break;
        case 'joined':
          query = query.order('created_at', { ascending: sortOrder === 'asc' });
          break;
        case 'name':
          query = query.order('display_name', { ascending: sortOrder === 'asc', nullsFirst: false });
          break;
        default:
          query = query.order('reputation_points', { ascending: false, nullsFirst: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { members: data, total: count || 0 };
    },
  });
}

export function useLeaderboard(period: 'weekly' | 'monthly' | 'alltime' = 'alltime', limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', period, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('reputation_points', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: ['user-badges', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
