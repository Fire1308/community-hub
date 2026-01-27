import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Calendar, Settings, UserPlus, UserMinus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { ActivityFeed } from '@/components/profile/ActivityFeed';
import { BackButton } from '@/components/layout/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useThreads } from '@/hooks/useThreads';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/supabase-types';

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
  const { data: threadsData } = useThreads({ authorId: profile?.id });
  const threads = threadsData?.threads || [];
  const totalUserThreads = threadsData?.total || 0;

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
      {/* Back Button */}
      <div className="container px-2 sm:px-4 pt-4">
        <BackButton fallbackPath="/members" />
      </div>
      
      {/* Cover Image */}
      <div 
        className="h-24 sm:h-32 md:h-48 bg-gradient-to-r from-primary/20 to-primary/5"
        style={profile.cover_image_url ? {
          backgroundImage: `url(${profile.cover_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      />

      <div className="container px-2 sm:px-4 -mt-12 sm:-mt-16 pb-8 max-w-full">
        {/* Profile Header */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 border-4 border-background -mt-10 sm:-mt-12 md:-mt-16 ring-4 ring-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl sm:text-3xl bg-primary/10 text-primary font-bold">
                  {profile.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">{profile.display_name || profile.username}</h1>
                  <span className="text-sm sm:text-base text-muted-foreground">@{profile.username}</span>
                </div>
                
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                {isOwnProfile ? (
                  <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                    <Link to="/settings">
                      <Settings className="h-4 w-4 mr-1.5" /> Edit
                    </Link>
                  </Button>
                ) : user && (
                  <>
                    <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                      <Link to={`/messages?user=${profile.username}`}>
                        <MessageSquare className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Message</span>
                      </Link>
                    </Button>
                    <Button size="sm" onClick={handleFollow} className="flex-1 sm:flex-none">
                      {isFollowing ? (
                        <><UserMinus className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Unfollow</span></>
                      ) : (
                        <><UserPlus className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Follow</span></>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
              <div className="text-center flex-1 sm:flex-none">
                <div className="text-lg sm:text-xl font-bold">{totalUserThreads}</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground">Threads</div>
              </div>
              <div className="text-center flex-1 sm:flex-none">
                <div className="text-lg sm:text-xl font-bold">{followersCount}</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="text-center flex-1 sm:flex-none">
                <div className="text-lg sm:text-xl font-bold">{followingCount}</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground">Following</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-3 sm:mb-4 w-full sm:w-auto">
            <TabsTrigger value="threads" className="flex-1 sm:flex-none text-xs sm:text-sm">Threads</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 sm:flex-none text-xs sm:text-sm">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="threads" className="space-y-2 sm:space-y-3">
            {threads.length > 0 ? (
              threads.map(thread => (
                <ThreadCard key={thread.id} thread={thread} />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center text-muted-foreground">
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
    </Layout>
  );
}
