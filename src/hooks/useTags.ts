import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tag } from '@/lib/supabase-types';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      return data as Tag[];
    },
  });
}

export function usePopularTags(limit = 10) {
  return useQuery({
    queryKey: ['popular-tags', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as Tag[];
    },
  });
}

export function useThreadTags(threadId: string) {
  return useQuery({
    queryKey: ['thread-tags', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thread_tags')
        .select(`
          tag:tags(*)
        `)
        .eq('thread_id', threadId);
      
      if (error) throw error;
      return data.map(item => item.tag) as Tag[];
    },
    enabled: !!threadId,
  });
}
