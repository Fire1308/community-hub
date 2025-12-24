import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { CreateThreadDialog } from '@/components/forum/CreateThreadDialog';
import { BackButton } from '@/components/layout/BackButton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useCategory } from '@/hooks/useCategories';
import { useThreads } from '@/hooks/useThreads';
import { usePinnedThreads } from '@/hooks/usePinnedThreads';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 10;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: category, isLoading: categoryLoading } = useCategory(slug!);
  const { data: pinnedThreads = [] } = usePinnedThreads(category?.id);
  const { data: threadsData, isLoading: threadsLoading } = useThreads({
    categoryId: category?.id,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const threads = threadsData?.threads || [];
  // Filter out pinned threads from regular list
  const regularThreads = threads.filter(t => !t.is_pinned);
  const totalThreads = threadsData?.total || 0;
  const totalPages = Math.ceil(totalThreads / PAGE_SIZE);

  if (categoryLoading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <Button asChild>
            <Link to="/categories">View All Categories</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-2 sm:px-4 py-4 sm:py-6 max-w-full">
        {/* Back Button & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
          <BackButton fallbackPath="/categories" />
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-foreground">Categories</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[120px] sm:max-w-none">{category.name}</span>
          </div>
        </div>

        {/* Category Header */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              <div
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg flex items-center justify-center text-2xl sm:text-3xl shrink-0"
                style={{ backgroundColor: category.color || '#3b82f6' + '20' }}
              >
                {category.icon || '💬'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold">{category.name}</h1>
                  {user && !category.is_locked && (
                    <Button size="sm" className="shrink-0 text-xs sm:text-sm" onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> <span className="hidden xs:inline">New</span> Thread
                    </Button>
                  )}
                </div>
                {category.description && (
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                )}
                {category.rules && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <h3 className="font-semibold mb-1 text-sm">Category Rules</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{category.rules}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pinned Threads Section - Separate card */}
        {pinnedThreads.length > 0 && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                <span>Pinned</span>
                <Pin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 px-2 sm:px-6">
              {pinnedThreads.map(thread => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </CardContent>
          </Card>
        )}

        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">
            Threads {totalThreads > 0 && `(${totalThreads})`}
          </h2>

          {threadsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 sm:p-4 h-20 sm:h-24" />
              </Card>
            ))
          ) : regularThreads.length > 0 ? (
            <>
              <div className="space-y-2 sm:space-y-3">
                {regularThreads.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  className="mt-6"
                />
              )}
            </>
          ) : pinnedThreads.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="mb-4">No threads in this category yet.</p>
                {user && !category.is_locked && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Start the First Thread
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <CreateThreadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultCategoryId={category.id}
      />
    </Layout>
  );
}
