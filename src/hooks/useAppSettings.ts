import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AppSettings {
  app_name: string;
  app_logo_url: string | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  app_name: 'Forum',
  app_logo_url: null,
};

export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_name', 'app_logo_url']);

      if (error) throw error;

      const settings: AppSettings = { ...DEFAULT_SETTINGS };
      data?.forEach((row) => {
        if (row.setting_key === 'app_name') {
          settings.app_name = row.setting_value as string || DEFAULT_SETTINGS.app_name;
        } else if (row.setting_key === 'app_logo_url') {
          settings.app_logo_url = row.setting_value as string | null;
        }
      });

      return settings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();
  const { role, user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<AppSettings>) => {
      if (role !== 'admin') {
        throw new Error('Only admins can update app settings');
      }

      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        updated_by: user?.id,
      }));

      for (const update of updates) {
        // Try update first
        const { data: existing } = await supabase
          .from('system_settings')
          .select('id')
          .eq('setting_key', update.setting_key)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('system_settings')
            .update({ setting_value: update.setting_value, updated_by: update.updated_by })
            .eq('setting_key', update.setting_key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('system_settings')
            .insert(update);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
  });
}
