import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pin, Lock, CheckCircle, Bookmark, BookmarkCheck, Share2, MoreHorizontal, Flag, Trash, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/layout/BackButton';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Layout } from '@/components/layout/Layout';
import { PostCard } from '@/components/forum/PostCard';
import { MarkdownEditor } from '@/components/forum/MarkdownEditor';
import { ReportDialog } from '@/components/forum/ReportDialog';
import { Poll } from '@/components/forum/Poll';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useThread, useUpdateThread, useDeleteThread } from '@/hooks/useThreads';
import { usePosts, useCreatePost, useDeletePost } from '@/hooks/usePosts';
import { useThreadTags } from '@/hooks/useTags';
import { useIsBookmarked, useToggleBookmark } from '@/hooks/useBookmarks';
import { useTrackThreadView, useIsFollowingThread, useToggleThreadFollow } from '@/hooks/useThreadFollow';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/lib/supabase-types';

const POSTS_PER_PAGE = 20;

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [replyContent, setReplyContent] = useState('');
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'thread'; id: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: thread, isLoading: threadLoading } = useThread(threadId!);
  const { data: postsData, isLoading: postsLoading } = usePosts(threadId!, {
    limit: POSTS_PER_PAGE,
    offset: (page - 1) * POSTS_PER_PAGE,
  });
  const posts = postsData?.posts || [];
  const totalPosts = postsData?.total || 0;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  
  const { data: tags = [] } = useThreadTags(threadId!);
  const { data: isBookmarked = false } = useIsBookmarked(threadId!);
  const { data: isFollowing = false } = useIsFollowingThread(threadId);
  
  // Track view count
  useTrackThreadView(threadId);
  
  const toggleBookmark = useToggleBookmark();
  const toggleFollow = useToggleThreadFollow();
  const createPost = useCreatePost();
  const updateThread = useUpdateThread();
  const deleteThread = useDeleteThread();
  const deletePost = useDeletePost();

  const isAuthor = user?.id === thread?.author_id;
  const canModerate = role === 'admin' || role === 'moderator';
  const canReply = user && !thread?.is_locked;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !threadId) return;

    try {
      let content = replyContent;
      if (quotedPost) {
        content = `> ${quotedPost.content.split('\n').join('\n> ')}\n\n${content}`;
      }

      await createPost.mutateAsync({
        thread_id: threadId,
        content,
      });

      setReplyContent('');
      setQuotedPost(null);
      toast({
        title: 'Reply posted',
        description: 'Your reply has been posted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post reply',
        variant: 'destructive',
      });
    }
  };

  const handleQuote = (post: Post) => {
    setQuotedPost(post);
    document.getElementById('reply-editor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleLock = async () => {
    if (!thread) return;
    await updateThread.mutateAsync({
      id: thread.id,
      updates: { is_locked: !thread.is_locked },
    });
    toast({
      title: thread.is_locked ? 'Thread unlocked' : 'Thread locked',
    });
  };

  const handleTogglePin = async () => {
    if (!thread) return;
    await updateThread.mutateAsync({
      id: thread.id,
      updates: { is_pinned: !thread.is_pinned },
    });
    toast({
      title: thread.is_pinned ? 'Thread unpinned' : 'Thread pinned',
    });
  };

  const handleDeleteThread = async () => {
    if (!thread) return;
    await deleteThread.mutateAsync(thread.id);
    toast({ title: 'Thread deleted' });
    navigate('/');
  };

  const handleDeletePost = async (post: Post) => {
    await deletePost.mutateAsync({ id: post.id, threadId: threadId! });
    toast({ title: 'Post deleted' });
  };

  const handleReport = (type: 'post' | 'thread', id: string) => {
    setReportTarget({ type, id });
    setReportOpen(true);
  };

  const handleToggleFollow = async () => {
    if (!threadId) return;
    const result = await toggleFollow.mutateAsync(threadId);
    toast({ title: result.action === 'followed' ? 'Now following this thread' : 'Unfollowed thread' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied to clipboard' });
  };

  if (threadLoading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!thread) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Thread not found</h1>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        {/* Back Button & Breadcrumb */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton fallbackPath={`/category/${thread.category?.slug}`} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to={`/category/${thread.category?.slug}`} className="hover:text-foreground">
              {thread.category?.name}
            </Link>
          </div>
        </div>

        {/* Thread Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-start gap-3 mb-4">
            {thread.is_pinned && (
              <Badge variant="secondary">
                <Pin className="h-3 w-3 mr-1" /> Pinned
              </Badge>
            )}
            {thread.is_locked && (
              <Badge variant="outline">
                <Lock className="h-3 w-3 mr-1" /> Locked
              </Badge>
            )}
            {thread.is_solved && (
              <Badge className="bg-green-500/10 text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" /> Solved
              </Badge>
            )}
            <h1 className="text-2xl md:text-3xl font-bold flex-1">{thread.title}</h1>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map(tag => (
                <Link key={tag.id} to={`/search?tag=${tag.slug}`}>
                  <Badge variant="secondary">#{tag.name}</Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const result = await toggleBookmark.mutateAsync(threadId!);
                toast({ title: result.added ? 'Bookmarked' : 'Bookmark removed' });
              }}
              disabled={!user || toggleBookmark.isPending}
            >
              {isBookmarked ? (
                <><BookmarkCheck className="h-4 w-4 mr-1" /> Bookmarked</>
              ) : (
                <><Bookmark className="h-4 w-4 mr-1" /> Bookmark</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleFollow}
              disabled={!user || toggleFollow.isPending}
            >
              {isFollowing ? (
                <><BellOff className="h-4 w-4 mr-1" /> Unfollow</>
              ) : (
                <><Bell className="h-4 w-4 mr-1" /> Follow</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>

            {(isAuthor || canModerate) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canModerate && (
                    <>
                      <DropdownMenuItem onClick={handleTogglePin}>
                        <Pin className="h-4 w-4 mr-2" />
                        {thread.is_pinned ? 'Unpin' : 'Pin'} Thread
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleToggleLock}>
                        <Lock className="h-4 w-4 mr-2" />
                        {thread.is_locked ? 'Unlock' : 'Lock'} Thread
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => handleReport('thread', thread.id)}>
                    <Flag className="h-4 w-4 mr-2" /> Report Thread
                  </DropdownMenuItem>
                  {(isAuthor || canModerate) && (
                    <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                      <Trash className="h-4 w-4 mr-2" /> Delete Thread
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Poll */}
        <div className="mb-6">
          <Poll threadId={threadId!} />
        </div>

        {/* Posts */}
        <div className="space-y-4 mb-6">
          {postsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-32" />
              </Card>
            ))
          ) : posts.length > 0 ? (
            posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                isFirstPost={page === 1 && index === 0}
                onReply={handleQuote}
                onReport={(p) => handleReport('post', p.id)}
                onDelete={handleDeletePost}
                canMarkSolution={isAuthor && !thread.is_solved}
                onMarkSolution={async (p) => {
                  await updateThread.mutateAsync({
                    id: thread.id,
                    updates: { is_solved: true },
                  });
                  toast({ title: 'Marked as solution' });
                }}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No posts yet. Be the first to reply!
              </CardContent>
            </Card>
          )}
        </div>

        {/* Post Pagination */}
        {totalPages > 1 && (
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mb-8"
          />
        )}

        {/* Reply Form */}
        {canReply ? (
          <Card id="reply-editor">
            <CardContent className="p-4 md:p-6">
              <h3 className="font-semibold mb-4">Reply to this thread</h3>
              {quotedPost && (
                <div className="mb-4 p-3 bg-muted rounded-lg relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => setQuotedPost(null)}
                  >
                    ×
                  </Button>
                  <p className="text-sm text-muted-foreground mb-1">Replying to @{quotedPost.author?.username}:</p>
                  <p className="text-sm line-clamp-2">{quotedPost.content}</p>
                </div>
              )}
              <form onSubmit={handleReply} className="space-y-4">
                <MarkdownEditor
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder="Write your reply... Markdown is supported!"
                  minHeight="150px"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!replyContent.trim() || createPost.isPending}>
                    {createPost.isPending ? 'Posting...' : 'Post Reply'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : thread?.is_locked ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>This thread is locked. No new replies can be posted.</p>
            </CardContent>
          </Card>
        ) : !user ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="mb-4 text-muted-foreground">Sign in to join the discussion</p>
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Report Dialog */}
      {reportTarget && (
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          type={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this thread? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteThread} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
