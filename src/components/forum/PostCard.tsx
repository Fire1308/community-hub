import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, Heart, MessageSquare, MoreHorizontal, Flag, Edit, Trash, CheckCircle, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/ui/role-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { usePostReactions, useAddReaction } from '@/hooks/usePosts';
import { useUserRole } from '@/hooks/useUserRoles';
import type { Post } from '@/lib/supabase-types';
import { Link } from 'react-router-dom';
import { sanitizeTextContent } from '@/lib/sanitize';

interface PostCardProps {
  post: Post;
  isFirstPost?: boolean;
  onReply?: (post: Post) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onReport?: (post: Post) => void;
  onMarkSolution?: (post: Post) => void;
  canMarkSolution?: boolean;
}

export function PostCard({
  post,
  isFirstPost = false,
  onReply,
  onEdit,
  onDelete,
  onReport,
  onMarkSolution,
  canMarkSolution = false,
}: PostCardProps) {
  const { user, role } = useAuth();
  const { data: authorRole } = useUserRole(post.author_id);
  const { data: reactions = [] } = usePostReactions(post.id);
  const addReaction = useAddReaction();

  const isAuthor = user?.id === post.author_id;
  const canModerate = role === 'admin' || role === 'moderator';

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userReactions = reactions.filter(r => r.user_id === user?.id).map(r => r.reaction_type);

  const handleReaction = (type: string) => {
    if (!user) return;
    addReaction.mutate({ postId: post.id, reactionType: type });
  };

  return (
    <Card className={isFirstPost ? 'border-primary/20' : ''}>
      <CardContent className="p-2.5 sm:p-4 md:p-6">
        <div className="flex gap-2 sm:gap-3 md:gap-4">
          {/* Author Info */}
          <div className="shrink-0">
            <Link to={`/profile/${post.author?.username}`}>
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 ring-2 ring-primary/20">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="text-xs sm:text-sm font-semibold bg-primary/10 text-primary">
                  {post.author?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Link to={`/profile/${post.author?.username}`} className="font-semibold text-sm sm:text-base hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-none">
                    {post.author?.display_name || post.author?.username}
                  </Link>
                  <RoleBadge role={authorRole} showLabel={false} />
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground flex-wrap">
                  <span className="truncate">@{post.author?.username}</span>
                  <span>•</span>
                  <span className="whitespace-nowrap">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  {post.is_edited && (
                    <>
                      <span className="hidden xs:inline">•</span>
                      <span className="italic hidden xs:inline">edited</span>
                    </>
                  )}
                </div>
              </div>

              {post.is_solution && (
                <Badge className="bg-green-500/10 text-green-600 shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 h-5">
                  <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" /> Solution
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none mb-3 sm:mb-4 text-sm sm:text-base break-words overflow-hidden">
              <div dangerouslySetInnerHTML={{ __html: sanitizeTextContent(post.content) }} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <Button
                variant={userReactions.includes('like') ? 'default' : 'ghost'}
                size="sm"
                className="h-7 sm:h-8 px-2 text-xs sm:text-sm"
                onClick={() => handleReaction('like')}
                disabled={!user}
              >
                <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                {reactionCounts['like'] || 0}
              </Button>
              <Button
                variant={userReactions.includes('love') ? 'default' : 'ghost'}
                size="sm"
                className="h-7 sm:h-8 px-2 text-xs sm:text-sm"
                onClick={() => handleReaction('love')}
                disabled={!user}
              >
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                {reactionCounts['love'] || 0}
              </Button>

              {user && onReply && (
                <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-2 text-xs sm:text-sm" onClick={() => onReply(post)}>
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" /> Reply
                </Button>
              )}

              {user && onReply && (
                <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-2 text-xs sm:text-sm" onClick={() => onReply(post)}>
                  <Quote className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" /> Quote
                </Button>
              )}

              {canMarkSolution && !post.is_solution && !isFirstPost && (
                <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-2 text-xs sm:text-sm hidden xs:flex" onClick={() => onMarkSolution?.(post)}>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" /> <span className="hidden sm:inline">Mark as</span> Solution
                </Button>
              )}

              {(isAuthor || canModerate) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                      <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isAuthor && (
                      <DropdownMenuItem onClick={() => onEdit?.(post)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                    )}
                    {(isAuthor || canModerate) && (
                      <DropdownMenuItem onClick={() => onDelete?.(post)} className="text-destructive">
                        <Trash className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onReport?.(post)}>
                      <Flag className="h-4 w-4 mr-2" /> Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
