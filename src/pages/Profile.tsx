import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Calendar, Settings, UserPlus, UserMinus, MessageSquare, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { ActivityFeed } from '@/components/profile/ActivityFeed';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useThreads } from '@/hooks/useThreads';
import { useToast } from '@/hooks/use-toast';
import type { Profile, Badge as BadgeType } from '@/lib/supabase-types';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile: currentProfile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('threads');

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  // Fetch user badges
  const { data: userBadges = [] } = useQuery({
    queryKey: ['user-badges', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', profile.id);
      return data?.map(ub => ub.badge) || [];
    },
    enabled: !!profile,
  });

  // Fetch followers count
  const { data: followersCount = 0 } = useQuery({
    queryKey: ['followers-count', profile?.id],
    queryFn: async () => {
      if (!profile) return 0;
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id);
      return count || 0;
    },
    enabled: !!profile,
  });

  // Fetch following count
  const { data: followingCount = 0 } = useQuery({
    queryKey: ['following-count', profile?.id],
    queryFn: async () => {
      if (!profile) return 0;
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id);
      return count || 0;
    },
    enabled: !!profile,
  });

  // Check if current user follows this profile
  const { data: isFollowing = false, refetch: refetchFollow } = useQuery({
    queryKey: ['is-following', profile?.id, user?.id],
    queryFn: async () => {
      if (!profile || !user) return false;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
        .single();
      return !!data;
    },
    enabled: !!profile && !!user,
  });

  // Fetch user threads
  const { data: threads = [] } = useThreads({ authorId: profile?.id });

  const isOwnProfile = user?.id === profile?.id;

  const handleFollow = async () => {
    if (!user || !profile) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);
        toast({ title: 'Unfollowed' });
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profile.id,
          });
        toast({ title: 'Following' });
      }
      refetchFollow();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (profileLoading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Cover Image */}
      <div 
        className="h-32 md:h-48 bg-gradient-to-r from-primary/20 to-primary/5"
        style={profile.cover_image_url ? {
          backgroundImage: `url(${profile.cover_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      />

      <div className="container -mt-16 pb-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background -mt-12 md:-mt-16">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-3xl">
                  {profile.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
                  <span className="text-muted-foreground">@{profile.username}</span>
                </div>
                
                {profile.bio && (
                  <p className="text-muted-foreground mb-3">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" /> {profile.reputation_points} reputation
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Button variant="outline" asChild>
                    <Link to="/settings">
                      <Settings className="h-4 w-4 mr-2" /> Edit Profile
                    </Link>
                  </Button>
                ) : user && (
                  <>
                    <Button variant="outline" asChild>
                      <Link to={`/messages?user=${profile.username}`}>
                        <MessageSquare className="h-4 w-4 mr-2" /> Message
                      </Link>
                    </Button>
                    <Button onClick={handleFollow}>
                      {isFollowing ? (
                        <><UserMinus className="h-4 w-4 mr-2" /> Unfollow</>
                      ) : (
                        <><UserPlus className="h-4 w-4 mr-2" /> Follow</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-xl font-bold">{threads.length}</div>
                <div className="text-sm text-muted-foreground">Threads</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{followersCount}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{followingCount}</div>
                <div className="text-sm text-muted-foreground">Following</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="threads">Threads</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="threads" className="space-y-4">
                {threads.length > 0 ? (
                  threads.map(thread => (
                    <ThreadCard key={thread.id} thread={thread} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No threads yet
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activity">
                <ActivityFeed userId={profile.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Badges</CardTitle>
              </CardHeader>
              <CardContent>
                {userBadges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(userBadges as BadgeType[]).map(badge => (
                      <Badge key={badge.id} variant="secondary" className="gap-1">
                        {badge.icon} {badge.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No badges earned yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
