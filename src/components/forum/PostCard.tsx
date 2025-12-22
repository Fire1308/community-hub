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
      <CardContent className="p-4 md:p-6">
        <div className="flex gap-4">
          {/* Author Info */}
          <div className="shrink-0">
            <Link to={`/profile/${post.author?.username}`}>
              <Avatar className="h-10 w-10 md:h-12 md:w-12">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback>
                  {post.author?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${post.author?.username}`} className="font-semibold hover:text-primary transition-colors">
                    {post.author?.display_name || post.author?.username}
                  </Link>
                  <RoleBadge role={authorRole} />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>@{post.author?.username}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  {post.is_edited && (
                    <>
                      <span>•</span>
                      <span className="italic">edited</span>
                    </>
                  )}
                </div>
              </div>

              {post.is_solution && (
                <Badge className="bg-green-500/10 text-green-600 shrink-0">
                  <CheckCircle className="h-3 w-3 mr-1" /> Solution
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
              <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={userReactions.includes('like') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleReaction('like')}
                disabled={!user}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {reactionCounts['like'] || 0}
              </Button>
              <Button
                variant={userReactions.includes('love') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleReaction('love')}
                disabled={!user}
              >
                <Heart className="h-4 w-4 mr-1" />
                {reactionCounts['love'] || 0}
              </Button>

              {user && onReply && (
                <Button variant="ghost" size="sm" onClick={() => onReply(post)}>
                  <MessageSquare className="h-4 w-4 mr-1" /> Reply
                </Button>
              )}

              {user && onReply && (
                <Button variant="ghost" size="sm" onClick={() => onReply(post)}>
                  <Quote className="h-4 w-4 mr-1" /> Quote
                </Button>
              )}

              {canMarkSolution && !post.is_solution && !isFirstPost && (
                <Button variant="ghost" size="sm" onClick={() => onMarkSolution?.(post)}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Mark as Solution
                </Button>
              )}

              {(isAuthor || canModerate) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
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
