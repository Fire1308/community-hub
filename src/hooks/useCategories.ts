import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Category } from '@/lib/supabase-types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Category | null;
    },
    enabled: !!slug,
  });
}

export function useCategoryThreadCount(categoryId: string) {
  return useQuery({
    queryKey: ['category-thread-count', categoryId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!categoryId,
  });
}
