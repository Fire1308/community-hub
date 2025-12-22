import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export function useAdminUsers(search = '', limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['admin-users', search, limit, offset],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      // Fetch roles and bans separately
      const userIds = data?.map(u => u.id) || [];
      const [rolesResult, bansResult] = await Promise.all([
        supabase.from('user_roles').select('*').in('user_id', userIds),
        supabase.from('user_bans').select('*').in('user_id', userIds).eq('is_active', true),
      ]);

      const usersWithRoles = data?.map(user => ({
        ...user,
        user_roles: rolesResult.data?.filter(r => r.user_id === user.id) || [],
        user_bans: bansResult.data?.filter(b => b.user_id === user.id) || [],
      }));

      return { users: usersWithRoles || [], total: count || 0 };
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First delete existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useBanUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      banType,
      reason,
      expiresAt,
    }: {
      userId: string;
      banType: 'temporary' | 'permanent' | 'shadow';
      reason?: string;
      expiresAt?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('user_bans').insert({
        user_id: userId,
        banned_by: user.id,
        ban_type: banType,
        reason,
        expires_at: expiresAt,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_bans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export interface ReportWithDetails {
  id: string;
  reason: string;
  description: string | null;
  status: string | null;
  created_at: string;
  reporter_id: string;
  reported_post_id: string | null;
  reported_thread_id: string | null;
  reported_user_id: string | null;
  reporter?: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  reported_thread?: { id: string; title: string; slug: string } | null;
  reported_post?: { id: string; content: string; thread_id: string } | null;
  reported_user?: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
}

export function usePendingReports() {
  return useQuery({
    queryKey: ['pending-reports'],
    queryFn: async (): Promise<ReportWithDetails[]> => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const reports = data || [];

      // Collect IDs for batch fetching
      const reporterIds = [...new Set(reports.map(r => r.reporter_id).filter(Boolean))];
      const threadIds = [...new Set(reports.map(r => r.reported_thread_id).filter(Boolean))] as string[];
      const postIds = [...new Set(reports.map(r => r.reported_post_id).filter(Boolean))] as string[];
      const userIds = [...new Set(reports.map(r => r.reported_user_id).filter(Boolean))] as string[];

      // Fetch related data in parallel
      const [reportersRes, threadsRes, postsRes, usersRes] = await Promise.all([
        reporterIds.length > 0
          ? supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', reporterIds)
          : Promise.resolve({ data: [] }),
        threadIds.length > 0
          ? supabase.from('threads').select('id, title, slug').in('id', threadIds)
          : Promise.resolve({ data: [] }),
        postIds.length > 0
          ? supabase.from('posts').select('id, content, thread_id').in('id', postIds)
          : Promise.resolve({ data: [] }),
        userIds.length > 0
          ? supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', userIds)
          : Promise.resolve({ data: [] }),
      ]);

      const reportersMap = new Map((reportersRes.data || []).map((p: any) => [p.id, p]));
      const threadsMap = new Map((threadsRes.data || []).map((t: any) => [t.id, t]));
      const postsMap = new Map((postsRes.data || []).map((p: any) => [p.id, p]));
      const usersMap = new Map((usersRes.data || []).map((u: any) => [u.id, u]));

      return reports.map(r => ({
        ...r,
        reporter: reportersMap.get(r.reporter_id) || null,
        reported_thread: r.reported_thread_id ? threadsMap.get(r.reported_thread_id) || null : null,
        reported_post: r.reported_post_id ? postsMap.get(r.reported_post_id) || null : null,
        reported_user: r.reported_user_id ? usersMap.get(r.reported_user_id) || null : null,
      }));
    },
  });
}

export function useResolveReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string; action: 'resolved' | 'dismissed' }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('reports')
        .update({
          status: action,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reports'] });
    },
  });
}

export function useForumStats() {
  return useQuery({
    queryKey: ['forum-stats'],
    queryFn: async () => {
      const [usersResult, threadsResult, postsResult, todayPostsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('threads').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalThreads: threadsResult.count || 0,
        totalPosts: postsResult.count || 0,
        postsToday: todayPostsResult.count || 0,
      };
    },
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: {
      name: string;
      slug: string;
      description?: string;
      icon?: string;
      color?: string;
      parent_id?: string;
      rules?: string;
    }) => {
      const { error } = await supabase.from('categories').insert(category);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      is_locked?: boolean;
      rules?: string;
    }) => {
      const { error } = await supabase.from('categories').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
