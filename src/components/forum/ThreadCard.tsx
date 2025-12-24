import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Eye, Pin, Lock, CheckCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/role-badge';
import { useUserRole } from '@/hooks/useUserRoles';
import { useIsBookmarked, useToggleBookmark } from '@/hooks/useBookmarks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { Thread } from '@/lib/supabase-types';

interface ThreadCardProps {
  thread: Thread;
  showBookmarkButton?: boolean;
}

export function ThreadCard({ thread, showBookmarkButton = true }: ThreadCardProps) {
  const { data: authorRole } = useUserRole(thread.author_id);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: isBookmarked = false } = useIsBookmarked(thread.id);
  const toggleBookmark = useToggleBookmark();

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({ title: 'Sign in to bookmark threads' });
      return;
    }

    const wasBookmarked = isBookmarked;

    // Optimistic update
    queryClient.setQueryData(['bookmark', thread.id, user.id], !wasBookmarked);

    try {
      await toggleBookmark.mutateAsync(thread.id);
      const { dismiss } = toast({
        title: wasBookmarked ? 'Bookmark removed' : 'Bookmarked',
        description: wasBookmarked ? undefined : 'Undo?',
        action: wasBookmarked ? undefined : (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              dismiss();
              queryClient.setQueryData(['bookmark', thread.id, user.id], true);
              await toggleBookmark.mutateAsync(thread.id);
            }}
          >
            Undo
          </Button>
        ),
      });
    } catch {
      // Revert optimistic update
      queryClient.setQueryData(['bookmark', thread.id, user.id], wasBookmarked);
      toast({ title: 'Failed to update bookmark', variant: 'destructive' });
    }
  };

  return (
    <Link to={`/thread/${thread.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group relative">
        <CardContent className="p-2 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            {/* Author Avatar - More prominent */}
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={thread.author?.avatar_url || undefined} />
              <AvatarFallback className="text-sm sm:text-base font-semibold bg-primary/10 text-primary">
                {thread.author?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 overflow-hidden">
              {/* Title */}
              <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1 break-words mb-1">
                {thread.title}
              </h3>

              {/* Author Name - More prominent */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-1.5">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">{thread.author?.display_name || thread.author?.username}</span>
                  <RoleBadge role={authorRole} showLabel={false} />
                </span>
                {thread.category && (
                  <Badge variant="outline" className="font-normal text-[10px] sm:text-xs shrink-0 max-w-[100px] sm:max-w-none truncate">
                    <span className="truncate">{thread.category.icon} {thread.category.name}</span>
                  </Badge>
                )}
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-1 mb-1">
                {thread.is_pinned && (
                  <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5">
                    <Pin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                  </Badge>
                )}
                {thread.is_locked && (
                  <Badge variant="outline" className="shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5">
                    <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                  </Badge>
                )}
                {thread.is_solved && (
                  <Badge className="bg-green-500/10 text-green-600 shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5">
                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>{thread.reply_count}</span>
                  <span className="hidden sm:inline">replies</span>
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>{thread.view_count}</span>
                  <span className="hidden sm:inline">views</span>
                </span>
                <span className="hidden xs:inline">
                  {formatDistanceToNow(new Date(thread.last_activity_at || thread.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Bookmark Button */}
            {showBookmarkButton && user && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleBookmarkClick}
                disabled={toggleBookmark.isPending}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
