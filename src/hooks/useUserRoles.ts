import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export function useUserRole(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return 'member' as AppRole;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) return 'member' as AppRole;
      return data.role as AppRole;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useUserRoles(userIds: string[]) {
  return useQuery({
    queryKey: ['user-roles-batch', userIds.sort().join(',')],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      
      if (error) throw error;
      
      const roleMap: Record<string, AppRole> = {};
      data?.forEach(row => {
        roleMap[row.user_id] = row.role as AppRole;
      });
      
      return roleMap;
    },
    enabled: userIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
