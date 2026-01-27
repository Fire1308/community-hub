import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Heart, UserPlus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserActivity, ActivityItem } from '@/hooks/useActivityFeed';

interface ActivityFeedProps {
  userId: string;
}

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  switch (type) {
    case 'post':
      return <MessageSquare className="h-4 w-4 text-primary" />;
    case 'thread':
      return <FileText className="h-4 w-4 text-green-500" />;
    case 'reaction':
      return <Heart className="h-4 w-4 text-red-500" />;
    case 'follow':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
  }
}

function ActivityText({ activity }: { activity: ActivityItem }) {
  switch (activity.type) {
    case 'post':
      return (
        <span>
          Replied in{' '}
          <Link 
            to={`/thread/${activity.data.threadSlug}`}
            className="font-medium text-primary hover:underline"
          >
            {activity.data.threadTitle}
          </Link>
        </span>
      );
    case 'thread':
      return (
        <span>
          Created thread{' '}
          <Link 
            to={`/thread/${activity.data.threadSlug}`}
            className="font-medium text-primary hover:underline"
          >
            {activity.data.threadTitle}
          </Link>
        </span>
      );
    case 'reaction':
      return (
        <span>
          Reacted with {activity.data.reactionType} to a post in{' '}
          <Link 
            to={`/thread/${activity.data.threadSlug}`}
            className="font-medium text-primary hover:underline"
          >
            {activity.data.threadTitle}
          </Link>
        </span>
      );
    case 'follow':
      return (
        <span>
          Started following{' '}
          <Link 
            to={`/profile/${activity.data.targetUsername}`}
            className="font-medium text-primary hover:underline"
          >
            @{activity.data.targetUsername}
          </Link>
        </span>
      );
  }
}

export function ActivityFeed({ userId }: ActivityFeedProps) {
  const { data: activities, isLoading } = useUserActivity(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-4">
        {activities.map((activity) => (
          <div 
            key={activity.id} 
            className="flex items-start gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200"
          >
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-muted shrink-0">
              <ActivityIcon type={activity.type} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm line-clamp-2">
                <ActivityText activity={activity} />
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
