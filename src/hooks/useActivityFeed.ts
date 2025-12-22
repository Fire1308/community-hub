import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  type: 'post' | 'reaction' | 'follow' | 'thread';
  created_at: string;
  data: {
    threadId?: string;
    threadTitle?: string;
    threadSlug?: string;
    postContent?: string;
    reactionType?: string;
    targetUserId?: string;
    targetUsername?: string;
  };
}

export function useUserActivity(userId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['user-activity', userId, limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!userId) return [];

      const activities: ActivityItem[] = [];

      // Fetch user's posts
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          thread:threads!inner(id, title, slug)
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (posts) {
        posts.forEach((post: any) => {
          activities.push({
            id: `post-${post.id}`,
            type: 'post',
            created_at: post.created_at,
            data: {
              threadId: post.thread?.id,
              threadTitle: post.thread?.title,
              threadSlug: post.thread?.slug,
              postContent: post.content?.substring(0, 150),
            },
          });
        });
      }

      // Fetch user's threads
      const { data: threads } = await supabase
        .from('threads')
        .select('id, title, slug, created_at')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (threads) {
        threads.forEach((thread: any) => {
          activities.push({
            id: `thread-${thread.id}`,
            type: 'thread',
            created_at: thread.created_at,
            data: {
              threadId: thread.id,
              threadTitle: thread.title,
              threadSlug: thread.slug,
            },
          });
        });
      }

      // Fetch user's reactions
      const { data: reactions } = await supabase
        .from('reactions')
        .select(`
          id,
          reaction_type,
          created_at,
          post:posts!inner(
            id,
            thread:threads!inner(id, title, slug)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (reactions) {
        reactions.forEach((reaction: any) => {
          activities.push({
            id: `reaction-${reaction.id}`,
            type: 'reaction',
            created_at: reaction.created_at,
            data: {
              reactionType: reaction.reaction_type,
              threadId: reaction.post?.thread?.id,
              threadTitle: reaction.post?.thread?.title,
              threadSlug: reaction.post?.thread?.slug,
            },
          });
        });
      }

      // Fetch user's follows
      const { data: follows } = await supabase
        .from('follows')
        .select(`
          id,
          created_at,
          following_id
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (follows) {
        // Get profile info for followed users
        const followingIds = follows.map(f => f.following_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', followingIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

        follows.forEach((follow: any) => {
          activities.push({
            id: `follow-${follow.id}`,
            type: 'follow',
            created_at: follow.created_at,
            data: {
              targetUserId: follow.following_id,
              targetUsername: profileMap.get(follow.following_id) || 'Unknown',
            },
          });
        });
      }

      // Sort all activities by date
      return activities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, limit);
    },
    enabled: !!userId,
  });
}
