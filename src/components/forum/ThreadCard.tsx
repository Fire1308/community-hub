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
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Author Avatar */}
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={thread.author?.avatar_url || undefined} />
              <AvatarFallback>
                {thread.author?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Title with badges */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {thread.is_pinned && (
                  <Badge variant="secondary" className="shrink-0">
                    <Pin className="h-3 w-3 mr-1" /> Pinned
                  </Badge>
                )}
                {thread.is_locked && (
                  <Badge variant="outline" className="shrink-0">
                    <Lock className="h-3 w-3 mr-1" /> Locked
                  </Badge>
                )}
                {thread.is_solved && (
                  <Badge className="bg-green-500/10 text-green-600 shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" /> Solved
                  </Badge>
                )}
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {thread.title}
                </h3>
              </div>

              {/* Author & Category */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1.5">
                  by <span className="font-medium text-foreground">{thread.author?.display_name || thread.author?.username}</span>
                  <RoleBadge role={authorRole} showLabel={false} />
                </span>
                {thread.category && (
                  <>
                    <span>in</span>
                    <Badge variant="outline" className="font-normal">
                      {thread.category.icon} {thread.category.name}
                    </Badge>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {thread.reply_count} replies
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {thread.view_count} views
                </span>
                <span>
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
