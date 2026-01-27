import { Link } from 'react-router-dom';
import { Bookmark, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { useBookmarks, useToggleBookmark } from '@/hooks/useBookmarks';
import { useAuth } from '@/contexts/AuthContext';
export default function BookmarksPage() {
  const { user } = useAuth();
  const { data: bookmarks = [], isLoading, isError, error, refetch } = useBookmarks();
  const toggleBookmark = useToggleBookmark();
  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="mb-4">Please sign in to view bookmarks</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-2 sm:px-4 py-4 sm:py-8 max-w-full">
        <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6">Bookmarks</h1>

        {isError ? (
          <Card>
            <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
              <p className="mb-2 sm:mb-3 text-sm">Failed to load bookmarks</p>
              <p className="text-xs mb-3 sm:mb-4">
                {(error as any)?.message || 'Please try again.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-2 sm:space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 sm:p-4 h-20 sm:h-24" />
              </Card>
            ))}
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="space-y-2 sm:space-y-4">
            {bookmarks.map(bookmark => (
              <div key={bookmark.id} className="relative group">
                {bookmark.thread && (
                  <ThreadCard thread={bookmark.thread as any} showBookmarkButton={false} />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 sm:h-8 sm:w-8 p-0"
                  onClick={() => toggleBookmark.mutate(bookmark.thread_id)}
                >
                  <Trash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center text-muted-foreground">
              <Bookmark className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No bookmarks yet</p>
              <p className="text-xs sm:text-sm mt-1 sm:mt-2">Save threads to read later</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
