import { TrendingUp, MessageSquare, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTrendingThreads } from '@/hooks/useTrendingThreads';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export function TrendingTopics() {
  const { data: threads, isLoading } = useTrendingThreads(5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : threads && threads.length > 0 ? (
          <div className="space-y-3">
            {threads.map((thread, index) => (
              <Link
                key={thread.id}
                to={`/thread/${thread.slug}`}
                className="block group"
              >
                <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {thread.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={thread.author?.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {(thread.author?.display_name || thread.author?.username || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{thread.author?.display_name || thread.author?.username}</span>
                      </div>
                      {thread.category && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1.5 py-0"
                          style={{ borderColor: thread.category.color || undefined }}
                        >
                          {thread.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {thread.reply_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {thread.view_count || 0}
                      </span>
                      {thread.recentPostCount > 0 && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Clock className="h-3 w-3" />
                          {thread.recentPostCount} new today
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No trending topics right now
          </p>
        )}
      </CardContent>
    </Card>
  );
}
