import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FestivalSettings {
  id: string;
  festival_id: string;
  title: string | null;
  subtitle: string | null;
  wish_text: string | null;
  background_gradient: string | null;
  is_active: boolean;
  custom_emojis: string[] | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useFestivalSettings() {
  return useQuery({
    queryKey: ['festival-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festival_settings' as any)
        .select('*')
        .order('festival_id');

      if (error) throw error;
      return (data || []) as unknown as FestivalSettings[];
    },
  });
}

export function useActiveFestival() {
  return useQuery({
    queryKey: ['active-festival'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('festival_settings' as any)
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      
      const festivals = (data || []) as unknown as FestivalSettings[];
      return festivals.length > 0 ? festivals[0] : null;
    },
  });
}

export function useUpdateFestivalSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      festivalId, 
      updates 
    }: { 
      festivalId: string; 
      updates: Partial<Omit<FestivalSettings, 'id' | 'festival_id' | 'created_at' | 'updated_at'>> 
    }) => {
      const { error } = await supabase
        .from('festival_settings' as any)
        .update(updates as any)
        .eq('festival_id', festivalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festival-settings'] });
      queryClient.invalidateQueries({ queryKey: ['active-festival'] });
    },
  });
}
