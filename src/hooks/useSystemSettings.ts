import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings' as any)
        .select('*');

      if (error) throw error;
      
      const settings: Record<string, any> = {};
      (data as unknown as SystemSetting[])?.forEach((s) => {
        settings[s.setting_key] = s.setting_value;
      });
      return settings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      if (role !== 'admin' && role !== 'moderator') {
        throw new Error('Only admins can update system settings');
      }

      const { error } = await supabase
        .from('system_settings' as any)
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}

export function useGlobalTheme() {
  const { data: settings } = useSystemSettings();
  
  return {
    forumTheme: settings?.forum_theme || 'default',
    festivalTheme: settings?.festival_theme || 'none',
  };
}
