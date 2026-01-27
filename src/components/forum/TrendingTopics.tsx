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
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {isLoading ? (
          <div className="space-y-2 sm:space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : threads && threads.length > 0 ? (
          <div className="space-y-1.5 sm:space-y-2">
            {threads.map((thread, index) => (
              <Link
                key={thread.id}
                to={`/thread/${thread.slug}`}
                className="block group"
              >
                <div className="flex items-start gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-muted active:scale-[0.99] transition-all duration-200">
                  <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {thread.title}
                    </h4>
                    <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                          <AvatarImage src={thread.author?.avatar_url || undefined} />
                          <AvatarFallback className="text-[6px] sm:text-[8px]">
                            {(thread.author?.display_name || thread.author?.username || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[60px] sm:max-w-none">{thread.author?.display_name || thread.author?.username}</span>
                      </div>
                      {thread.category && (
                        <Badge 
                          variant="outline" 
                          className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0 hidden xs:inline-flex"
                          style={{ borderColor: thread.category.color || undefined }}
                        >
                          {thread.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {thread.reply_count || 0}
                      </span>
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {thread.view_count || 0}
                      </span>
                      {thread.recentPostCount > 0 && (
                        <span className="flex items-center gap-0.5 sm:gap-1 text-primary font-medium">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {thread.recentPostCount} new
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
            No trending topics right now
          </p>
        )}
      </CardContent>
    </Card>
  );
}
